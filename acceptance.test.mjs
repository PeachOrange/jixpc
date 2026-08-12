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

test('后台经营总览隐藏下载经营明细按钮', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const dashboard = sourceSection(source, 'function renderDashboard()', 'function renderLevels()');
  assert.equal(dashboard.includes('下载经营明细'), false, '经营总览不应展示下载经营明细按钮');
  assert.ok(dashboard.includes('管理等级与权益'), '经营总览应保留等级与权益管理入口');
});

test('后台只保留三个店主管理二级菜单', () => {
  const menu = JSON.parse(JSON.stringify(adminModel().getAdminMenu()));
  const source = readFileSync(`${root}/app.js`, 'utf8');
  assert.equal(menu.length, 1);
  assert.equal(menu[0].name, '店主管理');
  assert.deepEqual(menu[0].children.map((item) => item.name), ['经营总览', '店主与开店', '等级与权益']);
  for (const marker of ['function renderStatuses()', 'function renderContentManagement()', 'function renderLogs()', 'function renderMigration()']) {
    assert.ok(source.includes(marker), `隐藏菜单的底层能力应继续保留：${marker}`);
  }
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

test('权益库不保存等级来源且等级选择弹窗不展示LV起始信息', () => {
  const model = adminModel();
  const created = model.createBenefit([], { name: '运营交流群', category: '运营类', description: '交流群', source: 'LV8起' });
  assert.equal(Object.hasOwn(created.records[0], 'source'), false);
  const updated = model.updateBenefit([{ id: 'B01', name: '旧权益', category: '运营类', source: 'LV5起' }], 'B01', { name: '新权益' });
  assert.equal(Object.hasOwn(updated.records[0], 'source'), false);

  const source = readFileSync(`${root}/app.js`, 'utf8');
  const initialBenefits = sourceSection(source, 'let benefits = [', 'const benefitAuditLogs');
  assert.equal(initialBenefits.includes('source:'), false, '权益初始化数据不应保存等级来源');
  const picker = sourceSection(source, 'function renderBenefitPicker()', 'function capFields');
  assert.equal(picker.includes('item.source'), false, '权益选择弹窗不应展示权益库等级来源');
  assert.ok(picker.includes("item.kind === 'parameterized' ? `参数化权益规则 · ${model.summarizeBenefitConfiguration(item)}` : '固定权益 · 无规则参数'"));
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

test('后台店主列表隐藏下载入口和状态列', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const styles = readFileSync(`${root}/styles.css`, 'utf8');
  const agentsPage = sourceSection(source, 'function renderAgents()', 'function renderRegistrations()');
  assert.equal(agentsPage.includes('下载当前明细'), false, '店主列表仍展示下载入口');
  assert.equal(agentsPage.includes('<span>状态</span>'), false, '店主列表仍展示状态表头');
  assert.equal(agentsPage.includes('${pill(row.status)}'), false, '店主列表仍展示行状态标签');
  assert.ok(agentsPage.includes('<option>全部状态</option>'), '店主列表应保留状态筛选');
  assert.ok(styles.includes('.owner-table { grid-template-columns: 1.45fr .72fr 1fr .82fr .72fr .55fr;'), '店主列表应调整为六列布局');
});

test('后台开店登记隐藏导出和风险提示', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const styles = readFileSync(`${root}/styles.css`, 'utf8');
  const registrationsPage = sourceSection(source, 'function renderRegistrations()', 'function renderStores()');
  for (const marker of ['导出登记', '<span>风险提示</span>', '同手机号多账号', '${row.risk ?']) {
    assert.equal(registrationsPage.includes(marker), false, `开店登记仍展示待隐藏内容：${marker}`);
  }
  assert.ok(registrationsPage.includes('data-registration-detail'), '开店登记应保留查看入口');
  assert.ok(registrationsPage.includes('data-open-owner'), '开店登记应保留开通店主入口');
  assert.ok(styles.includes('.registration-summary { grid-template-columns: repeat(3, 1fr);'), '登记统计区应调整为三列');
  assert.ok(styles.includes('.registration-table { grid-template-columns: 1.35fr 1fr 1fr .68fr .9fr 1fr;'), '登记列表应调整为六列');
});

test('后台开店登记详情隐藏处理边界说明', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const detail = sourceSection(source, 'function openRegistrationDetail(id)', 'function openStoreDetail(id)');
  for (const marker of [
    '处理边界', '不建设复杂审批', '登记成功不提前创建店主身份',
    '手动开通创建LV2、店铺资料与初始权益', '重复执行开通返回已有结果',
  ]) {
    assert.equal(detail.includes(marker), false, `登记详情仍展示处理边界内容：${marker}`);
  }
  assert.ok(detail.includes('<strong>登记信息</strong>'), '登记详情应保留登记信息');
  assert.ok(detail.includes('data-open-owner'), '待开通登记应保留开通店主按钮');
  assert.ok(detail.includes('data-close-drawer'), '登记详情应保留关闭或取消操作');
});

test('后台店主与开店隐藏店铺资料页签', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const tabs = sourceSection(source, 'const sectionTabs = {', 'const levels = [');
  assert.equal(tabs.includes("{ id: 'stores', name: '店铺资料' }"), false, '不应展示店铺资料页签');
  assert.ok(tabs.includes("{ id: 'owners', name: '店主列表' }"), '应保留店主列表页签');
  assert.ok(tabs.includes("{ id: 'registrations', name: '开店登记'"), '应保留开店登记页签');
  assert.ok(source.includes('function renderStores()'), '底层店铺资料能力应继续保留');
  assert.ok(source.includes('stores: renderStores'), '底层店铺资料路由应继续保留');
});

test('后台店主详情隐藏计算日志和多余操作', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const styles = readFileSync(`${root}/styles.css`, 'utf8');
  const drawer = sourceSection(source, 'function renderAgentDrawer()', 'function openAgentAction(');
  const tabs = sourceSection(drawer, 'const tabs = [', 'const tabBar =');
  assert.equal(tabs.includes("{ id: 'logs', name: '计算日志' }"), false, '店主详情仍展示计算日志页签');
  for (const marker of ['data-agent-action="recalculate"', '>重新计算</button>', 'data-agent-action="status"', '>状态调整</button>']) {
    assert.equal(drawer.includes(marker), false, `店主详情仍展示待隐藏操作：${marker}`);
  }
  assert.ok(drawer.includes('data-agent-action="level"'), '店主详情应保留手动调级');
  assert.ok(styles.includes('.drawer-tabs { display: grid; grid-template-columns: repeat(4, 1fr);'), '店主详情页签应调整为四列');
  assert.ok(source.includes('function openAgentAction(action)'), '店主操作底层能力应继续保留');
});

test('后台成长与权益仅保留当前等级摘要', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const styles = readFileSync(`${root}/styles.css`, 'utf8');
  const growth = sourceSection(source, 'const growth =', 'const upgradeHistory =');
  for (const marker of ['<span>当前状态</span>', '<span>规则版本</span>', '${pill(agent.status)}', '${state.version}']) {
    assert.equal(growth.includes(marker), false, `成长与权益摘要仍展示待隐藏信息：${marker}`);
  }
  assert.ok(growth.includes('class="agent-summary single"'), '当前等级摘要应使用单列布局');
  assert.ok(growth.includes('<span>当前等级</span>'), '成长与权益摘要应保留当前等级');
  assert.ok(styles.includes('.agent-summary.single { grid-template-columns: 1fr;'), '当前等级摘要应扩展为全宽');
});

test('后台店铺资料摘要隐藏当前状态并使用两列布局', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const styles = readFileSync(`${root}/styles.css`, 'utf8');
  const profile = sourceSection(source, 'const profile =', 'const growth =');
  for (const marker of ['<span>当前状态</span>', '${pill(agent.status)}']) {
    assert.equal(profile.includes(marker), false, `店铺资料摘要仍展示当前状态：${marker}`);
  }
  assert.ok(profile.includes('<span>店主</span>'), '店铺资料摘要应保留店主信息');
  assert.ok(profile.includes('<span>开通时间</span>'), '店铺资料摘要应保留开通时间');
  assert.ok(styles.includes('.agent-summary { display: grid; grid-template-columns: 1.2fr .7fr;'), '店铺资料摘要应调整为两列布局');
});

test('后台经营与收益隐藏店铺收益方案卡片', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const income = sourceSection(source, 'const income =', 'const calculationLogs =');
  for (const marker of ['commission-card', '当前店铺收益方案', '订单快照为准', '方案版本', '方案1.2', '主要品类', '鞋服 6% · 手机 3%']) {
    assert.equal(income.includes(marker), false, `经营与收益仍展示店铺收益方案：${marker}`);
  }
  for (const marker of ['经营指标', '店铺客户（推广人数）', '团队有效订单', '已结算店铺收益', '待结算业务收益']) {
    assert.ok(income.includes(marker), `经营与收益缺少经营指标：${marker}`);
  }
});

test('后台操作记录仅展示不含规则版本的升级轨迹', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const drawer = sourceSection(source, 'function renderAgentDrawer()', 'function openAgentAction(');
  const upgradeHistory = sourceSection(drawer, 'const upgradeHistory =', 'const income =');
  for (const marker of ['const statusHistory =', '状态记录', 'const issuanceHistory =', '权益发放记录', 'agentIssuance']) {
    assert.equal(drawer.includes(marker), false, `操作记录仍展示待隐藏区块：${marker}`);
  }
  assert.equal(upgradeHistory.includes('规则版本'), false, '升级记录描述仍展示规则版本');
  assert.ok(upgradeHistory.includes('手动调整至 LV4'), '升级记录缺少手动调整等级记录');
  assert.ok(upgradeHistory.includes('操作人：陈运营'), '手动调整记录缺少操作人');
  assert.ok(drawer.includes('const operations =') && drawer.includes('${upgradeHistory}'), '操作记录应保留升级轨迹');
});

test('后台等级规则页隐藏版本历史与发布入口', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const tabs = sourceSection(source, 'const sectionTabs = {', 'const levels = [');
  const levelsPage = sourceSection(source, 'function renderLevels()', 'function renderVersions()');
  assert.equal(tabs.includes("{ id: 'versions', name: '版本历史' }"), false, '不应展示版本历史页签');
  for (const marker of ['查看版本历史', '发布新版本', '当前生效版本', '查看历史 →', 'draft-banner', 'data-open-publish', 'data-tab="versions"']) {
    assert.equal(levelsPage.includes(marker), false, `等级规则页仍展示版本入口：${marker}`);
  }
  assert.ok(levelsPage.includes('pageHead()'), '等级规则页应保留无操作按钮的页面头部');
  assert.ok(source.includes('function renderVersions()'), '底层版本历史页面能力应继续保留');
});

test('后台等级规则页隐藏全部摘要并仅保留搜索入口', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const tabs = sourceSection(source, 'const sectionTabs = {', 'const levels = [');
  const levelsPage = sourceSection(source, 'function renderLevels()', 'function renderVersions()');
  assert.equal(tabs.includes("{ id: 'issuance', name: '权益发放记录' }"), false, '不应展示权益发放记录页签');
  for (const marker of ['rule-summary', '启用等级', '自动升级</span>', '暂停等级', '待发布修改', '全部升级方式', '<select>']) {
    assert.equal(levelsPage.includes(marker), false, `等级规则页仍展示待隐藏内容：${marker}`);
  }
  assert.ok(levelsPage.includes('data-table-search'), '等级规则页应保留等级搜索入口');
  assert.ok(source.includes('function renderIssuance()'), '底层权益发放记录能力应继续保留');
});

test('后台等级规则列表隐藏权益和收益方案两列', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const styles = readFileSync(`${root}/styles.css`, 'utf8');
  const levelsPage = sourceSection(source, 'function renderLevels()', 'function renderVersions()');
  for (const marker of ['本级新增权益', '店铺收益方案版本', '${row.benefits}', '${row.commission}']) {
    assert.equal(levelsPage.includes(marker), false, `等级规则列表仍展示待隐藏列：${marker}`);
  }
  assert.ok(levelsPage.includes('<span>升级方式</span>'), '等级规则列表应保留升级方式列');
  assert.ok(levelsPage.includes('${row.upgradeMode}'), '等级规则行应保留升级方式数据');
  assert.ok(styles.includes('.level-table { grid-template-columns: .55fr .8fr 2.2fr .75fr .6fr .5fr;'), '等级规则表应调整为六列布局');
});

test('后台等级编辑抽屉仅保留等级权益配置', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const drawer = sourceSection(source, 'function renderLevelDrawer()', 'function openLevelDrawer(');
  for (const marker of ['店铺收益与权益', '绑定指定版本', '店铺收益方案版本', 'id="level-commission"']) {
    assert.equal(drawer.includes(marker), false, `等级编辑抽屉仍展示收益方案配置：${marker}`);
  }
  assert.ok(drawer.includes('<strong>等级权益</strong>'), '等级编辑抽屉应保留等级权益区块');
  assert.ok(drawer.includes('data-add-level-benefit'), '等级编辑抽屉应保留添加权益入口');
});

test('后台等级编辑抽屉支持选择并保存升级方式', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const drawer = sourceSection(source, 'function renderLevelDrawer()', 'function openLevelDrawer(');
  const saveLevel = sourceSection(source, "const saveLevel = event.target.closest('[data-save-level]');", "if (event.target.closest('[data-new-benefit]'))");
  assert.ok(drawer.includes('<label>升级方式</label>'), '升级条件区域应展示升级方式');
  assert.ok(drawer.includes('id="level-upgrade-mode"'), '升级方式应使用独立下拉框');
  assert.ok(drawer.includes("row.upgradeMode || '自动升级'"), '未配置时应默认自动升级');
  assert.ok(drawer.includes('>自动升级</option>') && drawer.includes('>线下联系</option>'), '升级方式选项不完整');
  assert.ok(saveLevel.includes("row.upgradeMode = drawerBody.querySelector('#level-upgrade-mode').value"), '保存等级规则时应更新升级方式');
  assert.equal(saveLevel.includes("row.commission = drawerBody.querySelector('#level-commission').value"), false, '隐藏收益方案后不应继续读取该字段');
});

test('后台权益库隐藏发放记录入口和版本发布提示', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const benefitsPage = sourceSection(source, 'function renderBenefits()', 'function renderIssuance()');
  for (const marker of ['权益发放记录', 'rights-banner', '权益库 V2', '修改内容随下一个规则版本发布']) {
    assert.equal(benefitsPage.includes(marker), false, `权益库仍展示待隐藏内容：${marker}`);
  }
  assert.ok(benefitsPage.includes('data-new-benefit'), '权益库应保留新建权益入口');
  assert.ok(benefitsPage.includes('搜索权益名称或类别'), '权益库应保留搜索筛选能力');
  assert.ok(source.includes('function renderIssuance()'), '底层权益发放记录页面应继续保留');
});

test('后台权益库取消组内排序操作列并保留拖拽排序', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const styles = readFileSync(`${root}/styles.css`, 'utf8');
  const benefitsPage = sourceSection(source, 'function renderBenefits()', 'function renderIssuance()');
  for (const marker of ['组内排序', 'sort-controls', 'data-sort-benefit', '使用上下按钮']) {
    assert.equal(benefitsPage.includes(marker), false, `权益库仍展示组内排序操作：${marker}`);
  }
  assert.equal(source.includes("event.target.closest('[data-sort-benefit]')"), false, '不应保留上下移动按钮事件');
  assert.equal(styles.includes('.sort-controls'), false, '不应保留上下移动按钮样式');
  assert.ok(benefitsPage.includes('data-benefit-drag'), '应保留拖拽排序能力');
  assert.ok(benefitsPage.includes('展示排序'), '应保留展示排序数值列');
});

test('后台权益表单隐藏图标跳转和非状态业务规则', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const drawer = sourceSection(source, 'function benefitFormMarkup', 'function openIssuanceDetail');
  const saveHandler = sourceSection(source, "const saveBenefit = event.target.closest('[data-save-benefit]');", "const toggleBenefit = event.target.closest('[data-toggle-benefit]');");
  for (const marker of [
    'benefit-icon', '图标文字', 'benefit-link', '前台去使用跳转',
    'benefit-grant-mode', '发放方式', 'benefit-validity', '有效期规则',
    'benefit-business-rule', '生效口径', 'benefit-source', '前台开放范围',
  ]) {
    assert.equal(drawer.includes(marker), false, `权益抽屉仍展示待隐藏字段：${marker}`);
    assert.equal(saveHandler.includes(marker), false, `权益保存仍读取已隐藏字段：${marker}`);
  }
  assert.ok(drawer.includes('benefit-status'), '业务规则区域应保留当前状态');
  assert.ok(saveHandler.includes("status: root.querySelector('#benefit-status').value"), '保存时应继续读取当前状态');
});

test('后台权益抽屉隐藏当前引用信息但保留列表保护', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const drawer = sourceSection(source, 'function openBenefitDrawer', 'function openIssuanceDetail');
  const benefitsPage = sourceSection(source, 'function renderBenefits()', 'function renderIssuance()');
  for (const marker of ['reference-box', '当前引用', '线上版本正在使用', '历史版本', 'locked-note', 'const references =']) {
    assert.equal(drawer.includes(marker), false, `权益抽屉仍展示当前引用信息：${marker}`);
  }
  for (const marker of ['benefitReferences(row.id)', 'locked-action', '当前等级引用中']) {
    assert.ok(benefitsPage.includes(marker), `权益列表缺少引用保护：${marker}`);
  }
});

test('后台保留等级规则、隐藏版本历史入口并保留底层能力、权益库、状态和任务能力', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  for (const marker of ['等级规则', '权益库', '权益发放记录', '状态管理', '计算日志', '存量迁移']) {
    assert.ok(source.includes(marker));
  }
  for (const marker of ['let versionHistory = [', 'function renderVersions()', 'versions: renderVersions']) {
    assert.ok(source.includes(marker), `版本历史底层能力缺少：${marker}`);
  }
});

test('权益规则模板固定为七类只读定义且调用方不可篡改', () => {
  const model = adminModel();
  assert.equal(typeof model.getRuleTemplates, 'function');
  const templates = model.getRuleTemplates();
  assert.deepEqual(JSON.parse(JSON.stringify(templates.map((item) => item.name))), [
    '新人成交奖励', '品类订单佣金', '品类二级订单佣金', '开通店主与管理收益', '团队佣金', '每日视频下载', '每月鉴定次数',
  ]);
  assert.ok(templates.every((item) => item.readOnly === true));
  templates[0].name = '被修改的模板';
  assert.equal(model.getRuleTemplates()[0].name, '新人成交奖励');
});

test('品类直属与二级订单佣金是两个独立只读模板', () => {
  const model = adminModel();
  assert.deepEqual(JSON.parse(JSON.stringify(model.getBusinessCategories())), ['正品鞋', '正品服', '废旧手机', '普鞋', '旧衣', '旧书']);
  const templates = model.getRuleTemplates();
  assert.equal(templates.length, 7);
  const direct = templates.find((item) => item.id === 'category-commission');
  const secondary = templates.find((item) => item.id === 'category-secondary-commission');
  assert.equal(direct.name, '品类订单佣金');
  assert.equal(direct.fixedBase, '最终回收成交价');
  assert.deepEqual(JSON.parse(JSON.stringify(direct.parameters.map((item) => item.key))), ['categories', 'rate', 'cap']);
  assert.equal(direct.parameters.find((item) => item.key === 'rate').max, 100);
  assert.equal(secondary.name, '品类二级订单佣金');
  assert.equal(secondary.fixedBase, '最终回收成交价');
  assert.deepEqual(JSON.parse(JSON.stringify(secondary.parameters.map((item) => item.key))), ['categories', 'rate', 'cap']);
  assert.equal(secondary.parameters.find((item) => item.key === 'rate').max, 50);
});

test('参数化权益有有效规则参数即可进入等级选择', () => {
  const model = adminModel();
  const benefit = { kind: 'parameterized', templateId: 'monthly-appraisal', values: { monthlyQuota: 5 } };
  assert.equal(model.canAssignBenefit(benefit).allowed, true);
  assert.equal(model.canAssignBenefit({ ...benefit, values: {} }).allowed, false);
  assert.equal(model.canAssignBenefit({ kind: 'fixed' }).allowed, true);
});

test('等级权益按等级独立保存且不读取低等级权益', () => {
  const model = adminModel();
  const configuredLevels = [
    { level: 2, benefitIds: ['B01'] },
    { level: 3, benefitIds: ['B02'] },
    { level: 4, benefitIds: [] },
    { level: 5, benefitIds: ['B03'] },
  ];
  assert.deepEqual(JSON.parse(JSON.stringify(model.resolveLevelBenefitIds(configuredLevels, 3))), ['B02']);
  assert.deepEqual(JSON.parse(JSON.stringify(model.resolveLevelBenefitIds(configuredLevels, 4))), []);
  assert.deepEqual(JSON.parse(JSON.stringify(model.resolveLevelBenefitIds(configuredLevels, 5))), ['B03']);
});

test('参数化权益存在规则参数或等级引用时不可切换模板', () => {
  const model = adminModel();
  assert.equal(model.canChangeBenefitTemplate({ values: { amount: 10 } }, []).allowed, false);
  assert.equal(model.canChangeBenefitTemplate({ values: {} }, [2]).allowed, false);
  assert.equal(model.canChangeBenefitTemplate({ values: {} }, []).allowed, true);
});

test('品类直属与二级佣金分别校验比例和封顶', () => {
  const model = adminModel();
  assert.equal(model.validateBenefitConfiguration('category-commission', {
    items: [{ categories: ['正品鞋'], rate: 100, capType: 'capped', capAmount: 75 }],
  }).valid, true);
  assert.equal(model.validateBenefitConfiguration('category-commission', {
    items: [{ categories: ['正品鞋'], rate: 100.01, capType: 'unlimited' }],
  }).valid, false);
  assert.equal(model.validateBenefitConfiguration('category-secondary-commission', {
    items: [{ categories: ['正品鞋'], rate: 50, capType: 'capped', capAmount: 25 }],
  }).valid, true);
  assert.equal(model.validateBenefitConfiguration('category-secondary-commission', {
    items: [{ categories: ['正品鞋'], rate: 50.01, capType: 'unlimited' }],
  }).valid, false);
});

test('等级权益互斥只作用于当前等级完整清单', () => {
  const model = adminModel();
  const benefits = [
    { id: 'B01', kind: 'parameterized', templateId: 'newcomer-reward', values: { amount: 10 } },
    { id: 'B17', kind: 'parameterized', templateId: 'newcomer-reward', values: { amount: 20 } },
    { id: 'B05', kind: 'fixed', values: {} },
  ];
  const configuredLevels = [
    { level: 2, benefitIds: ['B01', 'B05'] },
    { level: 5, benefitIds: ['B17'] },
  ];
  assert.deepEqual(JSON.parse(JSON.stringify(model.resolveLevelBenefitIds(configuredLevels, 2, benefits))), ['B01', 'B05']);
  assert.deepEqual(JSON.parse(JSON.stringify(model.resolveLevelBenefitIds(configuredLevels, 5, benefits))), ['B17']);
  assert.deepEqual(JSON.parse(JSON.stringify(model.resolveLevelBenefitIds(configuredLevels, 8, benefits))), []);
});

test('规则参数摘要覆盖收益和额度模板', () => {
  const model = adminModel();
  assert.equal(model.summarizeBenefitConfiguration({ templateId: 'newcomer-reward', values: { amount: 10 } }), '10 元');
  assert.equal(model.summarizeBenefitConfiguration({ templateId: 'category-commission', values: { items: [{ categories: ['正品鞋'], rate: 15, capType: 'capped', capAmount: 75 }] } }), '1 组品类｜15% 起｜封顶 75 元');
  assert.equal(model.summarizeBenefitConfiguration({ templateId: 'daily-video', values: { dailyQuota: 2 } }), '每日 2 条');
  assert.equal(model.summarizeBenefitConfiguration({ templateId: 'monthly-appraisal', values: { monthlyQuota: 5 } }), '每月 5 次');
});

test('等级权益选择必须具备有效参数且同规则互斥', () => {
  const model = adminModel();
  const benefits = [
    { id: 'B01', kind: 'parameterized', templateId: 'newcomer-reward', values: { amount: 10 } },
    { id: 'B17', kind: 'parameterized', templateId: 'newcomer-reward', values: { amount: 20 } },
  ];
  assert.equal(model.validateLevelBenefitSelection([], benefits, 2, ['B01']).valid, true);
  assert.equal(model.validateLevelBenefitSelection([], benefits, 2, ['B01', 'B17']).valid, false);
});

test('权益参数变更实时生效并记录前后值操作人与时间', () => {
  const model = adminModel();
  const result = model.appendBenefitChangeLog([], {
    action: '修改规则参数', before: { dailyQuota: 1 }, after: { dailyQuota: 2 }, operator: '陈运营', time: '2026-08-12 10:30',
  });
  assert.equal(result.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(result[0])), {
    action: '修改规则参数', before: { dailyQuota: 1 }, after: { dailyQuota: 2 }, operator: '陈运营', time: '2026-08-12 10:30', effective: '实时生效',
  });
});

test('等级与权益页签顺序为等级规则权益库权益规则', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const tabs = sourceSection(source, 'const sectionTabs = {', 'const levels = [');
  assert.ok(tabs.includes("levels: [{ id: 'levels', name: '等级规则' }, { id: 'benefits', name: '权益库' }, { id: 'templates', name: '权益规则' }]"));
  assert.equal(tabs.includes("name: '权益规则模板'"), false, '页签不应继续显示“权益规则模板”');
});

test('权益库初始化为四类二十一项权益且十二项参数化', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const data = sourceSection(source, 'let benefits = [', 'let issuanceRows = [');
  for (const name of [
    '新人成交奖励 10 元', '新人成交奖励 20 元', '品类订单佣金（基础）', '品类二级订单佣金（基础）', '开通店主与管理收益', '团队佣金',
    '线上回收基础培训', '深度线上运营培训', '视频素材下载（每日 1 条）', '线上招募店主方案', '店主自媒体 IP 打造',
    '线下宣传与合作方案', '公司进阶店主交流群', '公司核心店主交流群', '店主专属客服',
    '最高等级店主证书', '鉴定服务（每月 5 次）',
  ]) assert.ok(data.includes(`name: '${name}'`), `缺少权益：${name}`);
  assert.equal((data.match(/kind: 'parameterized'/g) || []).length, 12);
  assert.equal((data.match(/kind: 'fixed'/g) || []).length, 9);
  assert.ok(data.includes("category: '证书类'"));
});

test('权益库将品类直属和二级佣金拆为两项并由LV2分别绑定', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const data = sourceSection(source, 'let benefits = [', 'let issuanceRows = [');
  assert.equal((data.match(/id: 'B\d+'/g) || []).length, 21);
  assert.match(data, /id: 'B02'.*templateId: 'category-commission'/s);
  assert.match(data, /id: 'B16'.*name: '品类二级订单佣金（基础）'.*templateId: 'category-secondary-commission'/s);
  assert.match(source, /level: 2[\s\S]*benefitIds: \['B01', 'B02', 'B16', 'B05'\]/);
});

test('存量多档参数拆为独立权益且等级直接绑定权益', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const benefitData = sourceSection(source, 'let benefits = [', 'const benefitAuditLogs = []');
  const levelData = sourceSection(source, 'const levels = [', 'let benefits = [');
  assert.equal(benefitData.includes('tiers:'), false);
  assert.equal(levelData.includes('tierSelections'), false);
  assert.match(benefitData, /id: 'B01'.*values: \{ amount: 10 \}/s);
  assert.match(benefitData, /id: 'B17'.*values: \{ amount: 20 \}/s);
  assert.match(levelData, /level: 5[\s\S]*benefitIds: \['B02', 'B16', 'B05', 'B06', 'B17', 'B03', 'B08'\]/);
});

test('权益规则模板页只读展示参数范围固定规则和使用数', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const page = sourceSection(source, 'function renderRuleTemplates()', 'function renderBenefits()');
  for (const marker of ['model.getRuleTemplates()', '参数定义', '固定规则', '使用权益', 'template.parameters', 'template.fixedRules']) {
    assert.ok(page.includes(marker), `模板目录缺少：${marker}`);
  }
  for (const marker of ['data-new-template', 'data-edit-template', 'data-delete-template']) {
    assert.equal(page.includes(marker), false, `只读模板目录不应包含操作：${marker}`);
  }
});

test('等级配置只编辑当前等级完整权益且每项均可移除', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const drawer = sourceSection(source, 'function renderLevelDrawer()', 'function openLevelDrawer(');
  assert.ok(drawer.includes('state.levelBenefitDraft.map'), '等级抽屉应直接渲染当前等级完整权益');
  assert.ok(drawer.includes('data-remove-level-benefit'), '每项等级权益均应可移除');
  assert.ok(drawer.includes('model.summarizeBenefitConfiguration'));
  for (const marker of ['model.resolveLevelBenefitIds', 'model.mergeBenefitSelection', '本级新增', '继承权益']) {
    assert.equal(drawer.includes(marker), false, `等级抽屉不应再包含继承逻辑：${marker}`);
  }

  const picker = sourceSection(source, 'function renderBenefitPicker()', 'function capFields');
  for (const marker of ['inheritedIds', '已由低等级继承', '继承，无需重复添加']) {
    assert.equal(picker.includes(marker), false, `权益选择器不应限制低等级权益：${marker}`);
  }
});

test('权益表单支持选择模板配置单组规则参数并查看实时日志', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const drawer = sourceSection(source, 'function capFields', 'function openIssuanceDetail');
  for (const marker of [
    'benefit-kind', 'benefit-template', '规则参数', 'data-benefit-rule-parameters',
    'data-rule-field="dailyQuota"', 'data-rule-field="monthlyQuota"', 'data-commission-field="rate"', '变更日志', '实时生效',
  ]) assert.ok(drawer.includes(marker), `权益规则配置缺少：${marker}`);
});

test('权益编辑页将规则模板字段更名为权益规则', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const form = sourceSection(source, 'function benefitFormMarkup', 'function renderBenefitEditor');
  assert.ok(form.includes('<label>权益规则</label>'), '权益编辑页缺少“权益规则”字段名');
  assert.equal(form.includes('<label>规则模板</label>'), false, '权益编辑页仍显示“规则模板”字段名');
  assert.ok(form.includes('id="benefit-template"'), '权益规则选择控件应继续保留');
});

test('佣金权益抽屉按模板只维护单层比例与封顶', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  assert.ok(source.includes("category-secondary-commission"));
  assert.ok(source.includes("templateId === 'category-commission' ? '直属店主佣金' : '上级店主佣金'"));
  assert.ok(source.includes('data-commission-field="rate"'));
  assert.ok(!source.includes('data-commission-field="directRate"'));
  assert.ok(!source.includes('data-commission-field="upstreamRate"'));
});

test('规则模板与参数档位具有清晰的专用布局样式', () => {
  const styles = readFileSync(`${root}/styles.css`, 'utf8');
  for (const marker of ['.template-grid', '.template-card', '.template-parameters', '.benefit-tier-card', '.tier-toolbar', '.commission-item', '.category-checks', '.level-benefit-row', '.benefit-editor-page', '.benefit-editor-layout']) {
    assert.ok(styles.includes(marker), `缺少规则配置样式：${marker}`);
  }
});

test('管理收益和团队佣金封顶金额必须大于零', () => {
  const model = adminModel();
  for (const templateId of ['management-income', 'team-commission']) {
    const result = model.validateBenefitConfiguration(templateId, { rate: 5, capType: 'capped', capAmount: 0 });
    assert.equal(result.valid, false);
    assert.ok(result.errors.includes('选择封顶时必须填写大于0的封顶金额'));
  }
});

test('权益表单不再提供新增复制或删除档位操作', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  for (const marker of ['data-add-benefit-tier', 'data-copy-benefit-tier', 'data-remove-benefit-tier', 'data-tier-name']) assert.equal(source.includes(marker), false);
});

test('品类佣金计算项支持单项删除并保留至少一项校验', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const modelSource = readFileSync(`${root}/model.js`, 'utf8');
  const editor = sourceSection(source, 'function renderCommissionItems', 'function renderRuleValues');
  const handler = sourceSection(source, "const addCommissionItem = event.target.closest('[data-add-commission-item]');", "const saveBenefit = event.target.closest('[data-save-benefit]');");
  assert.ok(editor.includes('data-remove-commission-item'));
  assert.ok(handler.includes("event.target.closest('[data-remove-commission-item]')"));
  assert.ok(handler.includes('state.benefitValuesDraft.items.splice'));
  assert.ok(modelSource.includes("errors.push('至少配置一个品类计算项')"));
});

test('权益规则更新统一保护形态模板和已引用等级', () => {
  const model = adminModel();
  const original = { kind: 'parameterized', templateId: 'daily-video', values: { dailyQuota: 1 } };
  assert.equal(model.canUpdateBenefitRule(original, { kind: 'fixed', templateId: '', values: {} }, [2]).allowed, false);
  assert.equal(model.canUpdateBenefitRule(original, { kind: 'fixed', templateId: '', values: {} }, []).allowed, false);
  assert.equal(model.canUpdateBenefitRule(original, { ...original, templateId: 'monthly-appraisal' }, []).allowed, false);
  assert.equal(model.canUpdateBenefitRule(original, { ...original, values: { dailyQuota: 2 } }, [2, 8]).allowed, true);
});

test('收益模板金额和比例最多保留两位小数', () => {
  const model = adminModel();
  assert.equal(model.validateBenefitConfiguration('newcomer-reward', { amount: 10.123 }).valid, false);
  assert.equal(model.validateBenefitConfiguration('management-income', { rate: 5.123, capType: 'unlimited' }).valid, false);
  const commission = model.validateBenefitConfiguration('category-commission', {
    items: [{ categories: ['正品鞋'], rate: 15.123, capType: 'unlimited' }],
  });
  assert.equal(commission.valid, false);
});

test('封顶类参数必须明确选择封顶方式', () => {
  const model = adminModel();
  assert.equal(model.validateBenefitConfiguration('management-income', { rate: 5, capAmount: 10 }).valid, false);
  const commission = model.validateBenefitConfiguration('category-commission', {
    items: [{ categories: ['正品鞋'], rate: 15, capAmount: 75 }],
  });
  assert.equal(commission.valid, false);
});

test('参数化权益直接保存一组规则参数且不再依赖档位', () => {
  const model = adminModel();
  const benefit = { kind: 'parameterized', templateId: 'monthly-appraisal', values: { monthlyQuota: 5 } };
  assert.equal(model.canAssignBenefit(benefit).allowed, true);
  assert.equal(model.canAssignBenefit({ ...benefit, values: {} }).allowed, false);
  assert.equal(model.summarizeBenefitConfiguration(benefit), '每月 5 次');
});

test('等级校验不读取其他等级的同规则权益', () => {
  const model = adminModel();
  const benefits = [
    { id: 'B01', kind: 'parameterized', templateId: 'newcomer-reward', values: { amount: 10 } },
    { id: 'B17', kind: 'parameterized', templateId: 'newcomer-reward', values: { amount: 20 } },
    { id: 'B05', kind: 'fixed', values: {} },
  ];
  const configuredLevels = [
    { level: 2, benefitIds: ['B01', 'B05'] },
    { level: 5, benefitIds: ['B17'] },
  ];
  assert.deepEqual(JSON.parse(JSON.stringify(model.resolveLevelBenefitIds(configuredLevels, 4, benefits))), []);
  assert.deepEqual(JSON.parse(JSON.stringify(model.resolveLevelBenefitIds(configuredLevels, 5, benefits))), ['B17']);
  assert.equal(model.validateLevelBenefitSelection(configuredLevels, benefits, 5, ['B17']).valid, true);
  assert.equal(model.validateLevelBenefitSelection(configuredLevels, benefits, 5, ['B01', 'B17']).valid, false);
});

test('存量等级物化完整权益且新增等级从空权益开始', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const levelData = sourceSection(source, 'const levels = [', 'let benefits = [');
  assert.match(levelData, /level: 3[\s\S]*benefitIds: \['B01', 'B02', 'B16', 'B05', 'B06'\]/);
  assert.match(levelData, /level: 4[\s\S]*benefitIds: \['B01', 'B02', 'B16', 'B05', 'B06'\]/);
  assert.match(levelData, /level: 12[\s\S]*benefitIds: \['B05', 'B06', 'B17', 'B03', 'B08', 'B09', 'B10', 'B18', 'B19', 'B11', 'B04', 'B20', 'B12', 'B13', 'B21', 'B14'\]/);
  const openLevel = sourceSection(source, 'function openLevelDrawer(', 'function openBenefitPicker()');
  assert.ok(openLevel.includes("benefitIds: []"), '新增等级应从空权益清单开始');
});

test('权益库将多档参数拆为独立权益并移除等级档位数据', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const levelData = sourceSection(source, 'const levels = [', 'let benefits = [');
  const benefitData = sourceSection(source, 'let benefits = [', 'const benefitAuditLogs = []');
  assert.equal(levelData.includes('tierSelections'), false);
  assert.equal(benefitData.includes('tiers:'), false);
  for (const marker of [
    "name: '新人成交奖励 10 元'", "name: '新人成交奖励 20 元'",
    "name: '视频素材下载（每日 1 条）'", "name: '视频素材下载（每日 2 条）'",
    "name: '鉴定服务（每月 5 次）'", "name: '鉴定服务（每月 10 次）'",
  ]) assert.ok(benefitData.includes(marker), `缺少拆分权益：${marker}`);
});

test('权益编辑页使用权益规则类别与单组规则参数文案', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const form = sourceSection(source, 'function benefitFormMarkup', 'function prepareBenefitForm');
  assert.ok(form.includes('<label>权益规则类别</label>'));
  assert.ok(form.includes('参数化权益规则'));
  assert.ok(form.includes('<strong>规则参数</strong>'));
  assert.equal(form.includes('参数档位'), false);
  assert.equal(form.includes('data-add-benefit-tier'), false);
});

test('等级绑定会拒绝参数值校验失败的权益', () => {
  const model = adminModel();
  const benefit = { kind: 'parameterized', templateId: 'daily-video', values: { dailyQuota: 0 } };
  const result = model.canAssignBenefit(benefit);
  assert.equal(result.allowed, false);
  assert.ok(result.reason.includes('规则参数无效'));
});

test('清空规则参数后可在无等级引用时切换模板', () => {
  const model = adminModel();
  const original = { kind: 'parameterized', templateId: 'daily-video', values: { dailyQuota: 1 } };
  const next = { kind: 'parameterized', templateId: 'monthly-appraisal', values: { monthlyQuota: 5 } };
  assert.equal(model.canUpdateBenefitRule(original, next, [], { templateWasCleared: false }).allowed, false);
  assert.equal(model.canUpdateBenefitRule(original, next, [], { templateWasCleared: true }).allowed, true);
  assert.equal(model.canUpdateBenefitRule(original, next, [2], { templateWasCleared: true }).allowed, false);
});

test('权益删除保留独立审计且列表支持形态与模板筛选', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const page = sourceSection(source, 'function renderBenefits()', 'function renderIssuance()');
  const deletion = sourceSection(source, "const deleteBenefit = event.target.closest('[data-delete-benefit]');", "const viewIssuance = event.target.closest('[data-view-issuance]');");
  for (const marker of ['benefitKindFilter', 'benefitTemplateFilter', 'data-benefit-kind-filter', 'data-benefit-template-filter']) assert.ok(page.includes(marker), `权益列表缺少筛选：${marker}`);
  for (const marker of ['benefitAuditLogs', '删除权益', 'before: item']) assert.ok(deletion.includes(marker), `权益删除缺少审计：${marker}`);
});

test('权益变更日志在抽屉中展示修改前后参数', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const timeline = sourceSection(source, 'function benefitChangeTimeline', 'function readBenefitValuesFromForm');
  for (const marker of ['修改前', '修改后', 'entry.before', 'entry.after']) assert.ok(timeline.includes(marker), `日志时间线缺少：${marker}`);
});

test('权益变更提示全部使用实时生效口径', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const events = sourceSection(source, "if (event.target.closest('[data-new-benefit]'))", "const viewIssuance = event.target.closest('[data-view-issuance]');");
  for (const marker of ['待发布', '待随新版本发布']) assert.equal(events.includes(marker), false, `权益变更仍保留版本口径：${marker}`);
  for (const marker of ['权益已创建并实时生效', '权益修改已保存并实时生效', '状态已实时更新', '权益已删除并实时生效']) assert.ok(events.includes(marker), `缺少实时生效提示：${marker}`);
});

test('权益库列表展示权益形态模板和规则参数摘要', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const page = sourceSection(source, 'function renderBenefits()', 'function renderIssuance()');
  for (const marker of ['规则配置', '固定权益', '参数化权益规则', 'templateName', 'model.summarizeBenefitConfiguration', '未配置，不可分配']) assert.ok(page.includes(marker), `权益列表缺少规则摘要：${marker}`);
});

test('等级权益保存不再进入草稿发布流程', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const saveLevel = sourceSection(source, "const saveLevel = event.target.closest('[data-save-level]');", "if (event.target.closest('[data-new-benefit]'))");
  assert.equal(saveLevel.includes('草稿'), false);
  assert.equal(saveLevel.includes('发布后生效'), false);
  assert.ok(saveLevel.includes('等级与权益已保存并实时生效'));
});

test('等级编辑使用横条权益并展示规则参数摘要', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const drawer = sourceSection(source, 'function renderLevelDrawer()', 'function openLevelDrawer(');
  for (const marker of ['level-benefit-row', 'level-benefit-parameter-summary', 'model.summarizeBenefitConfiguration', '当前等级权益', '固定权益 · 无规则参数']) {
    assert.ok(drawer.includes(marker), `等级权益横条缺少：${marker}`);
  }
  assert.equal(drawer.includes('本级新增'), false);
  assert.equal(drawer.includes('继承权益'), false);
  assert.equal(drawer.includes('完整权益预览'), false);
  assert.equal(source.includes('暂无继承权益'), false);
});

test('等级权益参数摘要与移除按钮使用横向紧凑控件样式', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const drawer = sourceSection(source, 'function renderLevelDrawer()', 'function openLevelDrawer(');
  for (const marker of ['level-benefit-parameter-summary', 'level-benefit-remove', 'aria-label="移除']) {
    assert.ok(drawer.includes(marker), `等级权益控件缺少：${marker}`);
  }
  assert.ok(drawer.includes('<span aria-hidden="true">×</span><span>移除</span>'));

  const css = readFileSync(`${root}/styles.css`, 'utf8');
  for (const marker of ['.level-benefit-parameter-summary', '.level-benefit-remove', 'grid-template-columns: minmax(120px, .9fr) minmax(0, 1.45fr) auto']) {
    assert.ok(css.includes(marker), `等级权益控件缺少样式：${marker}`);
  }
});

test('等级列表支持只在最高等级后新增等级', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const page = sourceSection(source, 'function renderLevels()', 'function renderVersions()');
  assert.ok(page.includes('data-new-level'));
  assert.ok(page.includes('${levels.length}'));
  const events = sourceSection(source, "const editLevel = event.target.closest('[data-edit-level]');", "const conditionToggle = event.target.closest('[data-condition-toggle]');");
  assert.ok(events.includes("event.target.closest('[data-new-level]')"));
  assert.ok(source.includes('Math.max(...levels.map((item) => item.level)) + 1'));
  assert.ok(source.includes('data-level-identity'));
});

test('新增和编辑权益进入内容区独立页面且查看仍使用抽屉', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  assert.ok(source.includes('benefitEditorOpen'));
  assert.ok(source.includes('function renderBenefitEditorPage()'));
  assert.ok(source.includes('data-back-benefit-library'));
  const events = sourceSection(source, "if (event.target.closest('[data-new-benefit]'))", "if (event.target.closest('[data-clear-benefit-rule]'))");
  assert.ok(events.includes("openBenefitEditor('create')"));
  assert.ok(events.includes("openBenefitDrawer('view'"));
  assert.ok(events.includes("openBenefitEditor('edit'"));
});

test('权益编辑页使用独立双列内容流与具名功能卡片', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const editor = sourceSection(source, 'function benefitFormMarkup', 'function prepareBenefitForm');
  for (const marker of ['benefit-display-section', 'benefit-rule-section', 'benefit-tier-section', 'benefit-log-section', 'benefit-editor-column', 'benefit-rule-grid']) {
    assert.ok(editor.includes(marker), `权益编辑页缺少结构标记：${marker}`);
  }
  const page = sourceSection(source, 'function renderBenefitEditorPage()', 'function openBenefitEditor(');
  for (const marker of ['benefit-editor-title', 'benefit-editor-actions', 'benefit-editor-layout']) {
    assert.ok(page.includes(marker), `权益编辑页头部缺少结构标记：${marker}`);
  }

  const css = readFileSync(`${root}/styles.css`, 'utf8');
  for (const marker of ['.benefit-editor-column', '.benefit-editor-layout .form-section', '.benefit-rule-grid', '.benefit-editor-actions']) {
    assert.ok(css.includes(marker), `权益编辑页缺少排版样式：${marker}`);
  }
  assert.equal(css.includes('.benefit-editor-layout .form-section:nth-child'), false, '编辑页不应再依赖卡片序号排版');
});

test('权益规则参数编辑器仅展示一组参数', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const editor = sourceSection(source, 'function renderBenefitRuleEditor', 'function benefitChangeTimeline');
  for (const marker of ['data-benefit-rule-parameters', 'renderRuleValues', '每项权益仅保存一组完整规则参数']) assert.ok(editor.includes(marker), `规则参数编辑器缺少：${marker}`);
  assert.equal(editor.includes('data-add-benefit-tier'), false);
  assert.equal(editor.includes('档位名称'), false);
});
