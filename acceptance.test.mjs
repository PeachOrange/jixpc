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

test('后台经营总览收敛为四项指标并解释有效经营', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const stats = sourceSection(source, 'function dashboardStats()', 'function renderDashboard()');
  assert.equal((stats.match(/<article class="stat-card/g) || []).length, 4, '经营总览顶部应只保留四项指标');
  for (const marker of [
    'dashboard-stats', '近90天有效经营率', 'stat-title-with-help', 'effective-operation-definition',
    '近90天内，本人或现有分佣团队至少产生1笔有效订单',
    '有效经营率 = 有效经营店主数 ÷ 正常店主总数', '即将升级店主',
  ]) {
    assert.ok(stats.includes(marker), `经营总览指标缺少：${marker}`);
  }
  assert.match(
    stats,
    /<div class="stat-title-with-help"><span>近90天有效经营率<\/span><details class="effective-operation-definition"><summary aria-label="查看有效经营说明">!<\/summary>/,
    '有效经营说明感叹号应紧跟在指标标题后',
  );
  assert.equal(stats.includes('<summary>什么是有效经营</summary>'), false, '不应继续在卡片底部展示文字说明按钮');
  for (const marker of ['stat-grid five', '临门店主', '计算失败', '支持失败重算']) {
    assert.equal(stats.includes(marker), false, `经营总览仍保留旧指标：${marker}`);
  }
  assert.ok(source.includes('观察有效经营、升级趋势和等级分布。'), '经营总览头部说明未随布局更新');
});

test('后台经营总览使用实时等级分布和通栏双列新布局', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const styles = readFileSync(`${root}/styles.css`, 'utf8');
  const dashboard = sourceSection(source, 'function renderDashboard()', 'function renderLevels()');
  for (const marker of [
    'dashboard-level-panel', 'live-update', 'data-level-live-time', '实时更新',
    '本月升级流向', '即将升级店主分布', '查看即将升级店主明细',
  ]) {
    assert.ok(dashboard.includes(marker), `经营总览新布局缺少：${marker}`);
  }
  for (const marker of ['数据按小时更新', '今日需关注', '临门等级分布', '查看临门店主明细', '等级计算健康度', 'health-panel']) {
    assert.equal(dashboard.includes(marker), false, `经营总览仍保留旧数据块：${marker}`);
  }
  assert.ok(source.includes('function refreshDashboardLiveTime()'), '缺少等级分布实时更新时间函数');
  assert.ok(source.includes('setInterval(refreshDashboardLiveTime, 1000)'), '等级分布更新时间未持续刷新');
  for (const marker of ['.dashboard-stats', '.dashboard-main', '.dashboard-secondary', '.stat-title-with-help', '.effective-operation-definition', '.live-update']) {
    assert.ok(styles.includes(marker), `经营总览缺少新布局样式：${marker}`);
  }
  assert.match(styles, /\.dashboard-stats\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);/, '顶部指标需要四列等宽布局');
  assert.match(styles, /\.dashboard-main\s*\{[^}]*grid-template-columns:\s*1fr;/, '等级分布需要通栏布局');
  assert.match(styles, /\.dashboard-secondary\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/, '下方分析需要双列布局');
});

test('后台只保留三个店主管理二级菜单', () => {
  const menu = JSON.parse(JSON.stringify(adminModel().getAdminMenu()));
  assert.equal(menu.length, 1);
  assert.equal(menu[0].name, '店主管理');
  assert.deepEqual(menu[0].children.map((item) => item.name), ['经营总览', '店主与开店', '等级与权益']);
});

test('后台经营总览与店主开店页隐藏已确认入口', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const styles = readFileSync(`${root}/styles.css`, 'utf8');
  const tabs = sourceSection(source, 'const sectionTabs = {', 'const levels = [');
  const dashboard = sourceSection(source, 'function renderDashboard()', 'function renderLevels()');
  const agents = sourceSection(source, 'function renderAgents()', 'function renderRegistrations()');
  const registrations = sourceSection(source, 'function renderRegistrations()', 'function renderStores()');
  assert.equal(dashboard.includes('下载经营明细'), false, '经营总览仍展示下载入口');
  assert.equal(tabs.includes("{ id: 'stores', name: '店铺资料' }"), false, '店主与开店仍展示店铺资料页签');
  for (const marker of ['下载当前明细', '<span>状态</span>', '${pill(row.status)}']) assert.equal(agents.includes(marker), false, `店主列表仍展示：${marker}`);
  for (const marker of ['导出登记', '<span>风险提示</span>', '同手机号多账号', '${row.risk ?']) assert.equal(registrations.includes(marker), false, `开店登记仍展示：${marker}`);
  assert.ok(styles.includes('.owner-table { grid-template-columns: 1.45fr .72fr 1fr .82fr .72fr .55fr;'), '店主列表未调整为六列');
  assert.ok(styles.includes('.registration-summary { grid-template-columns: repeat(3, 1fr);'), '登记统计区未调整为三列');
});

test('后台店主详情仅保留必要信息与操作', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const drawer = sourceSection(source, 'function renderAgentDrawer()', 'function openAgentAction(');
  const tabs = sourceSection(drawer, 'const tabs = [', 'const tabBar =');
  const growth = sourceSection(drawer, 'const growth =', 'const upgradeHistory =');
  const income = sourceSection(drawer, 'const income =', 'const calculationLogs =');
  assert.equal(tabs.includes("{ id: 'logs', name: '计算日志' }"), false, '店主详情仍展示计算日志');
  for (const marker of ['>重新计算</button>', '>状态调整</button>', '状态记录', '权益发放记录']) assert.equal(drawer.includes(marker), false, `店主详情仍展示：${marker}`);
  for (const marker of ['<span>当前状态</span>', '<span>规则版本</span>']) assert.equal(growth.includes(marker), false, `成长与权益摘要仍展示：${marker}`);
  for (const marker of ['commission-card', '当前店铺收益方案']) assert.equal(income.includes(marker), false, `经营与收益仍展示：${marker}`);
  assert.ok(drawer.includes('data-agent-action="level"'), '店主详情应保留手动调级');
  assert.ok(drawer.includes('手动调整至 LV4'), '升级记录缺少手动调整轨迹');
});

test('后台等级规则页仅保留规则与权益库', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const tabs = sourceSection(source, 'const sectionTabs = {', 'const levels = [');
  const levels = sourceSection(source, 'function renderLevels()', 'function renderVersions()');
  for (const marker of ["{ id: 'versions', name: '版本历史' }", "{ id: 'issuance', name: '权益发放记录' }"]) assert.equal(tabs.includes(marker), false, `等级页仍展示页签：${marker}`);
  for (const marker of ['查看版本历史', '发布新版本', 'draft-banner', 'rule-summary', '全部升级方式', '本级新增权益', '店铺收益方案版本', '${row.benefits}', '${row.commission}']) {
    assert.equal(levels.includes(marker), false, `等级规则页仍展示：${marker}`);
  }
  assert.ok(levels.includes('data-table-search'), '等级规则页应保留搜索');
  assert.ok(source.includes('function renderVersions()') && source.includes('function renderIssuance()'), '隐藏页签的底层能力应保留');
});

test('后台权益库与编辑抽屉仅保留必要字段', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const benefits = sourceSection(source, 'function renderBenefits()', 'function renderIssuance()');
  const drawer = sourceSection(source, 'function openBenefitDrawer', 'function openIssuanceDetail');
  for (const marker of ['权益发放记录', 'rights-banner', '组内排序', 'data-benefit-up', 'data-benefit-down']) assert.equal(benefits.includes(marker), false, `权益库仍展示：${marker}`);
  for (const marker of ['benefit-icon', '图标文字', 'benefit-link', '前台去使用跳转', '发放方式', '有效期规则', '生效口径', '前台开放范围', 'reference-box', '当前引用']) assert.equal(drawer.includes(marker), false, `权益抽屉仍展示：${marker}`);
  assert.ok(drawer.includes('benefit-status'), '权益抽屉应保留当前状态');
  assert.ok(benefits.includes('draggable="true"'), '权益库应保留拖拽排序');
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

test('后台隐藏版本与发放入口但保留底层能力', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  for (const marker of ['等级规则', '权益库', '状态管理', '计算日志', '存量迁移']) assert.ok(source.includes(marker));
  for (const marker of ['function renderVersions()', 'versions: renderVersions', 'function renderIssuance()', 'issuance: renderIssuance']) assert.ok(source.includes(marker), `底层能力缺少：${marker}`);
});

test('后台入口保留独立挂载点和操作弹层', () => {
  const html = readFileSync(`${root}/index.html`, 'utf8');
  assert.ok(html.includes('id="admin-app"'));
  assert.ok(html.includes('id="benefit-picker-modal"'));
  assert.ok(html.includes('id="confirm-modal"'));
});
