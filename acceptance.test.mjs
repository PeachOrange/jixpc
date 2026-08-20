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

test('等级与权益页签只保留等级规则和权益库', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const tabs = sourceSection(source, 'const sectionTabs = {', 'const levels = [');
  assert.ok(tabs.includes("levels: [{ id: 'levels', name: '等级规则' }, { id: 'benefits', name: '权益库' }]"));
  assert.equal(tabs.includes('权益规则'), false);
  assert.equal(tabs.includes("id: 'templates'"), false);
  const views = sourceSection(source, 'function render() {', 'function openDrawer(');
  assert.equal(views.includes('templates: renderRuleTemplates'), false);
});

test('后台等级固定为十五级并追加LV99特殊等级', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const levelData = sourceSection(source, 'const levels = [', 'let benefits = [');
  assert.equal((levelData.match(/level: \d+/g) || []).length, 15);
  for (const level of Array.from({ length: 15 }, (_, index) => index + 1)) {
    assert.ok(levelData.includes(`level: ${level}`), `缺少 LV${level}`);
  }
  for (const marker of [
    'level: 99', "identity: '区县店主'", "condition: '仅支持后台手动调整'",
    "relation: '人工指定'", "upgradeMode: '手动调整'", 'special: true', 'autoUpgrade: false',
  ]) assert.ok(source.includes(marker), `LV99配置缺少：${marker}`);
  const page = sourceSection(source, 'function renderLevels()', 'function renderVersions()');
  assert.equal(page.includes('data-new-level'), false);
  assert.ok(page.includes('共 ${levels.length} 个等级'));
});

test('权益库初始化为四类三十三项基础权益', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const data = sourceSection(source, 'let benefits = [', 'const benefitAuditLogs = []');
  assert.equal((data.match(/id: '[A-Z]\d{2}'/g) || []).length, 33);
  assert.equal((data.match(/category: '收益类'/g) || []).length, 20);
  assert.equal((data.match(/category: '运营类'/g) || []).length, 10);
  assert.equal((data.match(/category: '证书类'/g) || []).length, 1);
  assert.equal((data.match(/category: '鉴定类'/g) || []).length, 2);
  for (const marker of [
    "name: '新人成交奖励'", "name: '团队佣金5%'", "name: '区县佣金'",
    "name: '0基础线上回收培训'", "name: '最高等级店主证书'", "name: '每月10次鉴定'",
  ]) assert.ok(data.includes(marker), `权益库缺少：${marker}`);
  for (const marker of ['templateId:', 'values:', 'tiers:']) assert.equal(data.includes(marker), false);
});

test('权益库列表按分类展示基础说明且隐藏规则筛选和参数摘要', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const page = sourceSection(source, 'function renderBenefits()', 'function renderIssuance()');
  for (const marker of ['收益类', '运营类', '证书类', '鉴定类', '短说明', '详细说明', 'row.shortDescription', 'row.detailDescription']) {
    assert.ok(page.includes(marker), `权益列表缺少：${marker}`);
  }
  for (const marker of ['data-benefit-kind-filter', 'data-benefit-template-filter', '全部权益形态', '全部规则模板', '规则配置', '参数化权益规则', 'model.getRuleTemplates', 'model.summarizeBenefitConfiguration']) {
    assert.equal(page.includes(marker), false, `权益列表仍包含规则配置：${marker}`);
  }
});

test('权益编辑只维护名称分类短说明详细说明和状态', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const form = sourceSection(source, 'function benefitFormMarkup', 'function prepareBenefitForm');
  const save = sourceSection(source, "const saveBenefit = event.target.closest('[data-save-benefit]');", "const toggleBenefit = event.target.closest('[data-toggle-benefit]');");
  for (const marker of ['benefit-name', 'benefit-category', 'benefit-short-description', 'benefit-detail-description', 'benefit-status']) assert.ok(form.includes(marker));
  for (const marker of ['benefit-kind', 'benefit-template', '规则参数', 'data-rule-editor', 'benefit-rule-section', 'benefit-tier-section']) assert.equal(form.includes(marker), false);
  for (const marker of ['readBenefitValuesFromForm', 'validateBenefitValues', 'canUpdateBenefitRule', 'templateId,', 'values,']) assert.equal(save.includes(marker), false);
  assert.ok(save.includes("action: '修改权益基础信息'"));
});

test('权益编辑页提供变更日志并使用基础信息布局', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const editor = sourceSection(source, 'function benefitFormMarkup', 'function prepareBenefitForm');
  for (const marker of ['benefit-display-section', 'benefit-log-section', 'benefit-editor-column', '<strong>基础信息</strong>', '变更日志']) assert.ok(editor.includes(marker));
  for (const marker of ['benefit-rule-section', 'benefit-tier-section', 'benefit-rule-grid', 'data-add-benefit-tier']) assert.equal(editor.includes(marker), false);
  const page = sourceSection(source, 'function renderBenefitEditorPage()', 'function openBenefitEditor(');
  for (const marker of ['benefit-editor-title', 'benefit-editor-actions', 'benefit-editor-layout']) assert.ok(page.includes(marker));
});

test('等级权益使用物化累计配置并取消新增等级入口', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const levelData = sourceSection(source, 'const levels = [', 'let benefits = [');
  assert.match(levelData, /level: 3[\s\S]*benefitIds: \['B01', 'B02', 'B03', 'O01'\]/);
  assert.match(levelData, /level: 15[\s\S]*benefitIds: \[[^\]]*'B19'[^\]]*'C01'[^\]]*'A02'/);
  assert.ok(source.includes('level: 99'));
  assert.ok(source.includes('benefitIds: countyLevelBenefitIds'));
  const drawer = sourceSection(source, 'function renderLevelDrawer()', 'function openLevelDrawer(');
  assert.ok(drawer.includes('state.levelBenefitDraft.map'));
  assert.ok(drawer.includes('data-remove-level-benefit'));
});

test('LV12至LV15团队佣金互斥且每级只保留最高比例', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const levelData = sourceSection(source, 'const levels = [', 'let benefits = [');
  assert.match(levelData, /level: 12[\s\S]*benefitIds: \[[^\]]*'B16'[^\]]*\]/);
  assert.match(levelData, /level: 13[\s\S]*benefitIds: \[[^\]]*'B17'[^\]]*\]/);
  assert.match(levelData, /level: 14[\s\S]*benefitIds: \[[^\]]*'B18'[^\]]*\]/);
  assert.match(levelData, /level: 15[\s\S]*benefitIds: \[[^\]]*'B19'[^\]]*\]/);
  for (const [level, excluded] of [[12, ['B14']], [13, ['B14', 'B16']], [14, ['B14', 'B16', 'B17']], [15, ['B14', 'B16', 'B17', 'B18']]]) {
    const row = levelData.match(new RegExp(`level: ${level}[\\s\\S]*?benefitIds: \\[[^\\]]*\\]`))?.[0] || '';
    for (const benefitId of excluded) assert.equal(row.includes(`'${benefitId}'`), false, `LV${level}不应同时保留${benefitId}`);
  }
});

test('等级权益选择自动替换同组团队佣金', () => {
  const model = adminModel();
  const benefits = [
    { id: 'B14', name: '团队佣金1%', category: '收益类' },
    { id: 'B16', name: '团队佣金2%', category: '收益类' },
    { id: 'B17', name: '团队佣金3%', category: '收益类' },
  ];
  assert.deepEqual(JSON.parse(JSON.stringify(model.mergeBenefitSelection([], ['B14', 'B16', 'B17'], benefits))), ['B17']);
});

test('LV99继承LV15权益时排除团队佣金并追加区县佣金', () => {
  const model = adminModel();
  const result = model.resolveSpecialLevelBenefitIds(
    [{ level: 15, benefitIds: ['B01', 'B14', 'B16', 'B17', 'B18', 'B19', 'O01'] }],
    [
      { id: 'B01', name: '新人成交奖励' },
      { id: 'B14', name: '团队佣金1%' },
      { id: 'B16', name: '团队佣金2%' },
      { id: 'B17', name: '团队佣金3%' },
      { id: 'B18', name: '团队佣金4%' },
      { id: 'B19', name: '团队佣金5%' },
      { id: 'O01', name: '0基础线上回收培训' },
      { id: 'B20', name: '区县佣金' },
    ],
    { sourceLevel: 15, includeBenefitId: 'B20', excludedNameKeywords: ['团队佣金'] },
  );
  assert.deepEqual(JSON.parse(JSON.stringify(result)), ['B01', 'O01', 'B20']);
});

test('后台手动调级可以选择LV99并更新等级身份和人工维护进度', () => {
  const source = readFileSync(`${root}/app.js`, 'utf8');
  const action = sourceSection(source, 'function openAgentAction(action)', 'function openAppealDrawer');
  const save = sourceSection(source, "if (event.target.closest('[data-save-agent]'))", 'const saveAppeal =');
  for (const marker of ['id="agent-target-level"', 'LV99 区县店主', '仅支持后台手动调整']) assert.ok(action.includes(marker));
  for (const marker of ['agent.level = `LV${targetLevel.level}`', 'agent.identity = targetLevel.identity', '人工调整永久留痕', "targetLevel.special ? '人工维护' : agent.progress === '人工维护' ? '0%' : agent.progress"]) assert.ok(save.includes(marker));
});

test('后台模型支持权益基础信息维护并保护等级引用', () => {
  const model = adminModel();
  const created = model.createBenefit([], { name: '区县佣金', category: '收益类', shortDescription: '短说明', detailDescription: '详细说明' });
  assert.equal(created.ok, true);
  assert.equal(created.records[0].shortDescription, '短说明');
  const updated = model.updateBenefit(created.records, created.records[0].id, { name: '区县佣金权益' });
  assert.equal(updated.records[0].name, '区县佣金权益');
  assert.equal(model.deleteBenefit(updated.records, created.records[0].id, [created.records[0].id]).ok, false);
});
