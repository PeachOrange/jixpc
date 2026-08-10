import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = dirname(fileURLToPath(import.meta.url));

function loadGlobalScript(path, globalName) {
  const source = readFileSync(path, 'utf8');
  const sandbox = {};
  sandbox.globalThis = sandbox;
  vm.runInNewContext(source, sandbox, { filename: path });
  return sandbox[globalName];
}

function adminModel() {
  return loadGlobalScript(`${root}/model.js`, 'AdminModel');
}

function sourceSection(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `缺少起始标识：${startMarker}`);
  assert.notEqual(end, -1, `缺少结束标识：${endMarker}`);
  return source.slice(start, end);
}

test('后台只有店主管理一级菜单并合并六个二级菜单', () => {
  const menu = JSON.parse(JSON.stringify(adminModel().getAdminMenu()));
  assert.equal(menu.length, 1);
  assert.equal(menu[0].name, '店主管理');
  assert.deepEqual(menu[0].children.map((item) => item.name), ['经营总览', '店主与开店', '等级与权益', '状态管理', '内容管理', '任务中心']);
});

test('后台升级指标统一使用店铺客户店铺收益和团队店主', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const drawer = sourceSection(source, 'function renderLevelDrawer()', 'function openLevelDrawer(');
  for (const marker of ['店铺客户', '店铺收益', '团队店主']) {
    assert.ok(drawer.includes(marker), `后台升级指标缺少：${marker}`);
  }
  for (const marker of ['有效成交客户', '团队有效订单', '累计已结算店铺收益']) {
    assert.equal(drawer.includes(marker), false, `后台升级指标仍保留旧口径：${marker}`);
  }
  assert.ok(drawer.includes("const units = ['人', '元', '人']"), '后台升级指标单位顺序错误');
});

test('开店登记重复提交更新同一记录', () => {
  const model = adminModel();
  assert.equal(typeof model.upsertRegistration, 'function');
  const first = model.upsertRegistration([], { userId: 'U01', phone: '13800000000', storeName: '小陈回收店' });
  const second = model.upsertRegistration(first.records, { userId: 'U01', phone: '13800000000', storeName: '陈先生回收店' });
  assert.equal(second.records.length, 1);
  assert.equal(second.records[0].storeName, '陈先生回收店');
  assert.equal(second.updated, true);
});

test('后台手动开通店主保持幂等并生成LV2资料', () => {
  const model = adminModel();
  assert.equal(typeof model.openStoreOwner, 'function');
  const registrations = [{ id: 'R01', userId: 'U01', nickname: '陈先生', storeName: '' }];
  const first = model.openStoreOwner(registrations, [], 'R01', '陈运营');
  const second = model.openStoreOwner(first.registrations, first.profiles, 'R01', '陈运营');
  assert.equal(first.profiles.length, 1);
  assert.equal(first.profiles[0].level, 2);
  assert.equal(first.profiles[0].storeName, '陈先生回收店');
  assert.equal(second.profiles.length, 1);
  assert.equal(second.idempotent, true);
});

test('后台修改店名保留完整名称历史', () => {
  const model = adminModel();
  assert.equal(typeof model.renameStore, 'function');
  const profiles = [{ id: 'S01', storeName: '陈先生回收店', nameHistory: [] }];
  const result = model.renameStore(profiles, 'S01', '星光回收店', '陈运营', '品牌统一');
  assert.equal(result.ok, true);
  assert.equal(result.records[0].storeName, '星光回收店');
  assert.equal(result.records[0].nameHistory[0].before, '陈先生回收店');
  assert.equal(result.records[0].nameHistory[0].reason, '品牌统一');
});

test('等级规则缺少升级条件时阻断发布', () => {
  const result = adminModel().validateRule({ level: 5, conditions: [], commissionVersion: '1.2' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('至少启用一个升级条件'));
});

test('有效规则生成发布影响预览', () => {
  const result = adminModel().createPublishPreview({ currentVersion: '1.0', affectedAgents: 1268, immediateUpgrades: 86, benefitUpdates: 420 });
  assert.equal(result.nextVersion, '1.1');
  assert.equal(result.blocked, false);
});

test('等级新增权益合并时自动去重', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(adminModel().mergeBenefitSelection(['B01'], ['B01', 'B02']))), ['B01', 'B02']);
});

test('权益库支持新增更新删除和线上引用保护', () => {
  const model = adminModel();
  const rows = [{ id: 'B01', name: '团队收益', category: '收益类' }];
  const created = model.createBenefit(rows, { name: '店铺专属素材', category: '运营类', description: '专属素材', source: 'LV3起' });
  assert.equal(created.ok, true);
  const updated = model.updateBenefit(created.records, 'B02', { name: '店铺专属内容' });
  assert.equal(updated.records[1].name, '店铺专属内容');
  assert.equal(model.deleteBenefit(updated.records, 'B01', ['B01']).ok, false);
  assert.equal(model.deleteBenefit(updated.records, 'B02', ['B01']).ok, true);
});

test('权益固定按类别并在类别内排序', () => {
  const rows = [
    { id: 'B02', category: '运营类', order: 20 },
    { id: 'B01', category: '收益类', order: 30 },
    { id: 'B03', category: '运营类', order: 10 },
    { id: 'B04', category: '鉴定类', order: 10 },
  ];
  assert.deepEqual(JSON.parse(JSON.stringify(adminModel().sortBenefits(rows))).map((row) => row.id), ['B01', 'B03', 'B02', 'B04']);
});

test('权益发放暂停和恢复必须填写原因并保留记录', () => {
  const rows = [{ id: 'I01', status: '生效中', history: [] }];
  assert.equal(adminModel().changeIssuanceStatus(rows, 'I01', '暂停', '').ok, false);
  const paused = adminModel().changeIssuanceStatus(rows, 'I01', '暂停', '店主进入休眠');
  assert.equal(paused.records[0].status, '已暂停');
  assert.equal(paused.records[0].history.length, 1);
});

test('失败日志重算保留原记录并生成新记录', () => {
  const result = adminModel().retryCalculation([{ id: 'LOG-001', status: '失败', attempt: 1 }], 'LOG-001');
  assert.equal(result.length, 2);
  assert.equal(result[0].status, '失败');
  assert.equal(result[1].status, '成功');
});

test('存量身份迁移保持幂等并使用店主称谓', () => {
  const model = adminModel();
  const first = model.runMigration([], [{ id: 'A01', oldIdentity: '轻享代理' }]);
  const second = model.runMigration(first, [{ id: 'A01', oldIdentity: '轻享代理' }]);
  assert.equal(second.length, 1);
  assert.equal(second[0].newLevel, 'LV5');
  assert.equal(second[0].newIdentity, '轻享店主');
});

test('后台覆盖店主列表、开店登记、店铺资料和内容管理', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  for (const marker of ['店主列表', '开店登记', '开通店主', '店铺资料', '名称变更记录', '培训素材内容管理', '可见等级', '上下架状态']) {
    assert.ok(source.includes(marker), `缺少后台页面标识：${marker}`);
  }
});

test('后台保留等级规则、版本历史、权益库、状态和任务能力', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  for (const marker of ['等级规则', '版本历史', '权益库', '权益发放记录', '状态管理', '计算日志', '存量迁移']) {
    assert.ok(source.includes(marker));
  }
});

test('后台入口保留独立挂载点和操作弹层', () => {
  const html = readFileSync(`${root}/index.html`, 'utf8');
  assert.ok(html.includes('id="admin-app"'));
  assert.ok(html.includes('id="benefit-picker-modal"'));
  assert.ok(html.includes('id="confirm-modal"'));
});
