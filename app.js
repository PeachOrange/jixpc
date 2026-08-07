(function () {
  const model = globalThis.AdminModel;
  const content = document.getElementById('admin-content');
  const secondaryNavigation = document.getElementById('secondary-navigation');
  const primaryNavigation = document.querySelector('[data-menu-group="owner-management"]');
  const drawer = document.getElementById('detail-drawer');
  const drawerBackdrop = document.getElementById('drawer-backdrop');
  const drawerTitle = document.getElementById('drawer-title');
  const drawerKicker = document.getElementById('drawer-kicker');
  const drawerBody = document.getElementById('drawer-body');
  const drawerFooter = document.getElementById('drawer-footer');
  const publishModal = document.getElementById('publish-modal');
  const publishContent = document.getElementById('publish-content');
  const benefitPickerModal = document.getElementById('benefit-picker-modal');
  const benefitPickerList = document.getElementById('benefit-picker-list');
  const benefitPickerSearch = document.getElementById('benefit-picker-search');
  const benefitPickerCount = document.getElementById('benefit-picker-count');
  const confirmModal = document.getElementById('confirm-modal');
  const confirmTitle = document.getElementById('confirm-title');
  const confirmMessage = document.getElementById('confirm-message');
  const confirmAction = document.getElementById('confirm-action');
  const infoModal = document.getElementById('info-modal');
  const infoTitle = document.getElementById('info-title');
  const infoKicker = document.getElementById('info-kicker');
  const infoContent = document.getElementById('info-content');
  const autoUpgrade = document.getElementById('auto-upgrade');
  const globalSearch = document.getElementById('global-search');
  const toast = document.getElementById('toast');

  const menu = model.getAdminMenu()[0];
  const state = {
    section: 'levels', tab: 'levels', version: '1.0', autoUpgrade: true, migrationStep: 0,
    search: '', menuOpen: true, editingLevel: null, levelBenefitDraft: [], benefitPickerSelected: new Set(),
    editingBenefit: null, benefitMode: 'view', confirmAction: null, dragBenefitId: null,
    editingIssuance: null, issuanceAction: null, pendingChanges: 3,
    agentDetailId: null, agentDetailTab: 'profile', editingStoreId: null, editingContentId: null,
  };

  const sectionTabs = {
    owners: [{ id: 'owners', name: '店主列表' }, { id: 'registrations', name: '开店登记', badge: 3 }, { id: 'stores', name: '店铺资料' }],
    levels: [{ id: 'levels', name: '等级规则' }, { id: 'versions', name: '版本历史' }, { id: 'benefits', name: '权益库' }, { id: 'issuance', name: '权益发放记录' }],
    content: [{ id: 'content', name: '培训素材内容管理' }],
    tasks: [{ id: 'logs', name: '计算日志', badge: 3 }, { id: 'migration', name: '存量迁移' }],
  };

  const levels = [
    { level: 1, identity: '普通用户', condition: '注册后默认等级', relation: '固定等级', commission: '无店铺收益', benefitIds: [], benefits: '基础回收服务', enabled: true, targets: [0, 0, 0], upgradeMode: '不适用' },
    { level: 2, identity: '成长店主', condition: '有效客户 ≥ 3', relation: '全部满足', commission: '方案1.0', benefitIds: ['B01'], benefits: '鞋服业务收益', enabled: true, targets: [3, 0, 0], upgradeMode: '自动升级' },
    { level: 3, identity: '轻享店主', condition: '客户5｜团队6｜店铺收益¥2,000', relation: '全部满足', commission: '方案1.1', benefitIds: ['B01', 'B03'], benefits: '深度线上运营培训', enabled: true, targets: [5, 6, 2000], upgradeMode: '自动升级' },
    { level: 4, identity: '轻享店主', condition: '客户12｜团队12｜店铺收益¥5,000', relation: '全部满足', commission: '方案1.2', benefitIds: ['B01', 'B03'], benefits: '本级无新增权益', enabled: true, targets: [12, 12, 5000], upgradeMode: '自动升级' },
    { level: 5, identity: '轻享店主', condition: '客户20｜团队20｜店铺收益¥10,000', relation: '全部满足', commission: '方案1.2', benefitIds: ['B01', 'B02', 'B03'], benefits: '手机回收品类', enabled: true, targets: [20, 20, 10000], upgradeMode: '自动升级' },
    { level: 6, identity: '星享店主', condition: '客户30｜团队35｜店铺收益¥18,000', relation: '全部满足', commission: '方案1.5', benefitIds: ['B01', 'B02', 'B03'], benefits: '本级无新增权益', enabled: true, targets: [30, 35, 18000], upgradeMode: '自动升级' },
    { level: 7, identity: '星享店主', condition: '客户40｜团队55｜店铺收益¥28,000', relation: '全部满足', commission: '方案1.8', benefitIds: ['B01', 'B02', 'B03'], benefits: '本级无新增权益', enabled: true, targets: [40, 55, 28000], upgradeMode: '自动升级' },
    { level: 8, identity: '星享店主', condition: '客户50｜团队80｜店铺收益¥40,000', relation: '全部满足', commission: '方案2.0', benefitIds: ['B01', 'B02', 'B03', 'B04'], benefits: '每月30条成片素材', enabled: true, targets: [50, 80, 40000], upgradeMode: '自动升级' },
    { level: 9, identity: '超级店主', condition: '客户65｜团队120｜店铺收益¥65,000', relation: '全部满足', commission: '方案2.1', benefitIds: ['B01', 'B02', 'B03', 'B04'], benefits: '本级无新增权益', enabled: true, targets: [65, 120, 65000], upgradeMode: '自动升级' },
    { level: 10, identity: '超级店主', condition: '客户90｜团队180｜店铺收益¥100,000', relation: '全部满足', commission: '方案2.2', benefitIds: ['B01', 'B02', 'B03', 'B04'], benefits: '本级无新增权益', enabled: true, targets: [90, 180, 100000], upgradeMode: '自动升级' },
    { level: 11, identity: '超级店主', condition: '客户120｜团队260｜店铺收益¥160,000', relation: '全部满足', commission: '方案2.3', benefitIds: ['B01', 'B02', 'B03', 'B04'], benefits: '专属运营支持', enabled: true, targets: [120, 260, 160000], upgradeMode: '自动升级' },
    { level: 12, identity: '超级合伙人', condition: '满足资格后线下联系', relation: '线下审核', commission: '专属方案', benefitIds: ['B01', 'B02', 'B03', 'B04'], benefits: '合伙人权益包', enabled: true, targets: [0, 0, 0], upgradeMode: '线下联系' },
  ];

  let benefits = [
    { id: 'B01', name: '鞋服业务收益', category: '收益类', icon: '收', order: 10, shortDescription: '鞋服回收订单专属店铺收益', detailDescription: '根据订单生效时的店铺收益方案快照计算，历史订单不受新规则影响。', link: '我的钱包-店铺收益', grantMode: '达成等级后自动发放', validity: '保持该等级期间有效', businessRule: '按订单快照中的比例与计收益基数结算', description: '按订单快照中的比例与基数结算', source: 'LV2起', historyReferences: '版本0.9、1.0', status: '生效中' },
    { id: 'B02', name: '手机回收品类', category: '收益类', icon: '机', order: 20, shortDescription: '解锁手机回收业务及品类店铺收益', detailDescription: '达到指定等级后开放手机回收品类，店铺收益依照对应方案执行。', link: '我的回收店-可经营品类', grantMode: '达成等级后自动发放', validity: '保持该等级期间有效', businessRule: '发放后新建订单可使用，不追溯历史订单', description: '解锁手机回收业务与店铺收益', source: 'LV5起', historyReferences: '版本1.0', status: '生效中' },
    { id: 'B03', name: '深度线上运营培训', category: '运营类', icon: '学', order: 10, shortDescription: '完整的获客、转化与团队经营课程', detailDescription: '在培训中心解锁指定阶段课程、回放和随堂资料。', link: '我的回收店-培训素材', grantMode: '达成等级后自动发放', validity: '权益生效期间可反复学习', businessRule: '与课程库权限组同步', description: '获客、转化与团队经营系统课程', source: 'LV3起', historyReferences: '版本0.9、1.0', status: '生效中' },
    { id: 'B04', name: '每月30条成片素材', category: '运营类', icon: '材', order: 20, shortDescription: '每月提供30条可直接发布的视频与图文', detailDescription: '按月更新成片、封面、标题和配套文案，在发圈素材中使用。', link: '培训素材-发圈素材', grantMode: '达成等级后自动发放', validity: '每自然月重置可见内容', businessRule: '内容下架后不再展示，已下载不受影响', description: '每月可直接发布的成片素材', source: 'LV8起', historyReferences: '版本1.0', status: '生效中' },
    { id: 'B05', name: '鉴定服务次数权益', category: '鉴定类', icon: '鉴', order: 10, shortDescription: '按月赠送专属鉴定服务次数', detailDescription: '用于高价或疑难回收品的专人鉴定支持。', link: '我的回收店-鉴定服务', grantMode: '达成等级后按月发放', validity: '当月有效，不结转', businessRule: '次数使用后实时扣减', description: '每月赠送鉴定服务次数', source: '暂未配置', historyReferences: '无', status: '已暂停' },
  ];

  let issuanceRows = [
    { id: 'I0805001', agent: '陈先生 · A10248', benefitId: 'B01', benefit: '鞋服业务收益', sourceLevel: 'LV2', grantAt: '2026-05-18 09:30', effective: '长期有效', version: '1.0', status: '生效中', history: [] },
    { id: 'I0805002', agent: '陈先生 · A10248', benefitId: 'B03', benefit: '深度线上运营培训', sourceLevel: 'LV3', grantAt: '2026-06-02 11:16', effective: '等级期间有效', version: '1.0', status: '生效中', history: [] },
    { id: 'I0805003', agent: '吴女士 · A10250', benefitId: 'B01', benefit: '鞋服业务收益', sourceLevel: 'LV2', grantAt: '2026-04-09 15:22', effective: '休眠期间暂停', version: '0.9', status: '已暂停', history: [{ action: '暂停', reason: '店主进入休眠状态', time: '2026-08-01 00:00' }] },
    { id: 'I0805004', agent: '林先生 · A10251', benefitId: 'B04', benefit: '每月30条成片素材', sourceLevel: 'LV8', grantAt: '2026-07-20 10:08', effective: '2026-07-20 至 2026-08-19', version: '1.0', status: '已失效', history: [] },
  ];

  let versionHistory = [
    { version: '0.9', status: '已失效', effectiveAt: '2026-07-18 09:00', createdAt: '2026-07-17 18:36', operator: '王运营', summary: '调整LV3素材权益与团队门槛' },
    { version: '1.0', status: '生效中', effectiveAt: '2026-08-05 09:00', createdAt: '2026-08-04 20:16', operator: '陈运营', summary: '新增LV5手机品类与专属素材' },
  ];

  const agents = [
    { id: 'A10248', name: '陈先生', storeName: '陈先生回收店', phone: '138****6842', level: 'LV4', identity: '轻享店主', status: '正常', progress: '72%', customers: 18, orders: 26, commission: '¥18,620', openedAt: '2026-05-18' },
    { id: 'A10249', name: '周先生', storeName: '星光回收店', phone: '137****2910', level: 'LV3', identity: '轻享店主', status: '预警', progress: '84%', customers: 9, orders: 12, commission: '¥6,420', openedAt: '2026-06-02' },
    { id: 'A10250', name: '吴女士', storeName: '吴女士回收店', phone: '186****5108', level: 'LV2', identity: '成长店主', status: '休眠', progress: '31%', customers: 3, orders: 0, commission: '¥820', openedAt: '2026-04-09' },
    { id: 'A10251', name: '林先生', storeName: '邻里循环回收店', phone: '159****7714', level: 'LV8', identity: '星享店主', status: '限权', progress: '66%', customers: 62, orders: 148, commission: '¥72,680', openedAt: '2026-03-12' },
  ];

  let registrations = [
    { id: 'R001', userId: 'U2018', nickname: '赵女士', realName: '赵敏', phone: '136****1038', wechat: 'zhaomin88', city: '杭州市', storeName: '小赵回收店', channel: '小程序自然访问', submittedAt: '2026-08-07 09:42', opened: false, risk: '' },
    { id: 'R002', userId: 'U2019', nickname: '孙先生', realName: '孙伟', phone: '139****5621', wechat: 'sunwei56', city: '上海市', storeName: '', channel: '店主专属分享', submittedAt: '2026-08-07 09:16', opened: false, risk: '同手机号多账号登记' },
    { id: 'R003', userId: 'U1886', nickname: '李女士', realName: '李婷', phone: '158****2269', wechat: 'liting22', city: '南京市', storeName: '新生回收店', channel: '运营活动', submittedAt: '2026-08-06 17:30', opened: true, operator: '王运营', operatedAt: '2026-08-07 08:35' },
  ];

  let storeProfiles = [
    { id: 'S0001', userId: 'U10248', ownerId: 'A10248', ownerName: '陈先生', storeName: '陈先生回收店', storeNumber: 'JX-0805168', level: 4, identity: '轻享店主', status: '正常', openedAt: '2026-05-18 09:30', operator: '陈运营', nameHistory: [] },
    { id: 'S0002', userId: 'U10249', ownerId: 'A10249', ownerName: '周先生', storeName: '星光回收店', storeNumber: 'JX-0805172', level: 3, identity: '轻享店主', status: '预警', openedAt: '2026-06-02 11:16', operator: '王运营', nameHistory: [{ before: '周先生回收店', after: '星光回收店', operator: '王运营', reason: '店主品牌名称调整', time: '2026-07-12 14:20' }] },
    { id: 'S0003', userId: 'U1886', ownerId: 'A10312', ownerName: '李女士', storeName: '新生回收店', storeNumber: 'JX-0805236', level: 2, identity: '成长店主', status: '正常', openedAt: '2026-08-07 08:35', operator: '王运营', nameHistory: [] },
  ];

  let contentRows = [
    { id: 'C001', title: '换季旧鞋回收发圈素材', category: '发圈工具', format: '图文', order: 10, level: 'LV2及以上', status: '已上架', benefit: '发圈基础素材', updatedAt: '2026-08-07 09:10' },
    { id: 'C002', title: '一分钟了解回收店主经营模式', category: '视频素材', format: '视频', order: 20, level: 'LV2及以上', status: '已上架', benefit: '新店主学习内容', updatedAt: '2026-08-06 18:20' },
    { id: 'C003', title: '常见鞋服成色判断图解', category: '学习资料', format: '图文', order: 30, level: 'LV5及以上', status: '草稿', benefit: '高阶鉴定内容', updatedAt: '2026-08-06 16:35' },
  ];

  let logs = [
    { id: 'LOG-0805-001', agent: 'A10248 · 陈先生', source: '团队订单结算', version: '1.0', result: 'LV4 → LV4', status: '成功', time: '10:24:16', duration: '176毫秒', snapshot: '客户 16人｜团队 18笔｜店铺收益 8,620元', failStep: '无', attempt: 1 },
    { id: 'LOG-0805-002', agent: 'A10249 · 周先生', source: '周期校准', version: '1.0', result: '指标读取超时', status: '失败', time: '10:23:42', duration: '3,002毫秒', snapshot: '客户 9人｜团队订单读取超时｜店铺收益 6,420元', failStep: '第2步：读取近90天团队有效订单', attempt: 1 },
    { id: 'LOG-0805-003', agent: 'A10250 · 吴女士', source: '店主状态变化', version: '1.0', result: '进入休眠', status: '成功', time: '10:22:08', duration: '126毫秒', snapshot: '客户 3人｜团队 0笔｜近90天无有效经营', failStep: '无', attempt: 1 },
  ];

  const appeals = [
    { agent: '吴女士 · A10250', status: '休眠', reason: '已补充线下订单凭证，请求恢复经营状态', progress: '待受理', owner: '未分配' },
    { agent: '林先生 · A10251', status: '限权', reason: '申请复核团队收益限制', progress: '处理中', owner: '王运营' },
    { agent: '匿名店主 · A10188', status: '冻结', reason: '已提交身份及交易证明材料', progress: '待复核', owner: '李风控' },
  ];

  const moduleMeta = {
    dashboard: ['经营分析', '店主经营总览', '观察有效经营、开店转化、等级分布和异常状态。'],
    owners: ['店主管理', '店主与开店', '统一管理店主、开店登记和店铺资料。'],
    registrations: ['店主管理', '店主与开店', '查看登记资料并执行幂等的手动开通。'],
    stores: ['店主管理', '店主与开店', '维护一对一店铺资料和名称变更记录。'],
    levels: ['规则中心', '等级与权益', '配置升级规则、版本历史和权益库。'],
    versions: ['规则中心', '等级与权益', '配置升级规则、版本历史和权益库。'],
    benefits: ['规则中心', '等级与权益', '配置升级规则、版本历史和权益库。'],
    issuance: ['规则中心', '等级与权益', '查看权益发放结果、状态变化和操作留痕。'],
    statuses: ['风险治理', '状态管理', '维护店主状态影响模板和恢复方式。'],
    content: ['经营内容', '内容管理', '配置图文、视频、文案、可见等级与上下架状态。'],
    logs: ['系统任务', '任务中心', '追踪计算执行并完成存量迁移。'],
    migration: ['系统任务', '任务中心', '追踪计算执行并完成存量迁移。'],
  };

  function pill(value) {
    const tone = ['预警','休眠','待受理','待复核','已暂停','失败','已失效'].includes(value) ? 'warning' : ['限权','冻结','终止'].includes(value) ? 'danger' : value === '草稿' ? 'neutral' : '';
    return `<span class="pill ${tone}">${value}</span>`;
  }

  function pageHead(actions = '') {
    const [kicker, title, description] = moduleMeta[state.tab];
    return `<header class="page-head"><div><span class="page-kicker">${kicker}</span><h1>${title}</h1><p>${description}</p></div><div class="page-actions">${actions}</div></header>${renderTabs()}`;
  }

  function renderTabs() {
    const tabs = sectionTabs[state.section];
    if (!tabs) return '';
    return `<nav class="page-tabs" aria-label="${moduleMeta[state.tab][1]}页面切换">${tabs.map((tab) => `<button type="button" data-tab="${tab.id}" class="${state.tab === tab.id ? 'active' : ''}">${tab.name}${tab.badge ? `<b>${tab.badge}</b>` : ''}</button>`).join('')}</nav>`;
  }

  function renderNavigation() {
    secondaryNavigation.hidden = !state.menuOpen;
    primaryNavigation.classList.toggle('active', state.menuOpen);
    primaryNavigation.setAttribute('aria-expanded', String(state.menuOpen));
    primaryNavigation.querySelector('b').textContent = state.menuOpen ? '⌃' : '⌄';
    const icons = { dashboard: '概', owners: '店', levels: '级', statuses: '态', content: '材', tasks: '任' };
    secondaryNavigation.innerHTML = menu.children.map((item) => `<button type="button" data-section="${item.id}" class="${state.section === item.id ? 'active' : ''}"><i>${icons[item.id]}</i><span>${item.name}</span>${item.id === 'levels' ? '<b>3</b>' : item.id === 'tasks' ? '<b class="alert">3</b>' : ''}</button>`).join('');
  }

  function stats() {
    return `<section class="stat-grid"><article class="stat-card"><div class="stat-card-head"><span>店主总数</span><i>店</i></div><strong>12,680</strong><small>较上月 +4.8%</small></article><article class="stat-card"><div class="stat-card-head"><span>近升级店主</span><i>升</i></div><strong>1,426</strong><small>阈值 ≥ 80%</small></article><article class="stat-card"><div class="stat-card-head"><span>已达标待升级</span><i>待</i></div><strong>86</strong><small class="warning">自动升级${state.autoUpgrade ? '已开启' : '已暂停'}</small></article><article class="stat-card"><div class="stat-card-head"><span>计算失败</span><i>错</i></div><strong>${logs.filter((row) => row.status === '失败').length}</strong><small class="warning">支持失败重算</small></article></section>`;
  }

  function dashboardStats() {
    return `<section class="stat-grid five"><article class="stat-card"><div class="stat-card-head"><span>店主总数</span><i>店</i></div><strong>12,680</strong><small>较上月 +4.8%</small></article><article class="stat-card"><div class="stat-card-head"><span>近90天有效经营率</span><i>营</i></div><strong>78.6%</strong><small>较上周 +1.2%</small></article><article class="stat-card"><div class="stat-card-head"><span>本月升级人数</span><i>升</i></div><strong>642</strong><small>其中自动升级 618 人</small></article><article class="stat-card"><div class="stat-card-head"><span>临门店主</span><i>临</i></div><strong>1,426</strong><small>下一级完成度 ≥ 80%</small></article><article class="stat-card"><div class="stat-card-head"><span>计算失败</span><i>错</i></div><strong>${logs.filter((row) => row.status === '失败').length}</strong><small class="warning">支持失败重算</small></article></section>`;
  }

  function renderDashboard() {
    return `${pageHead('<button class="button" data-toast="经营明细已导出">下载经营明细</button><button class="primary-button" data-section="levels">管理等级与权益</button>')}${dashboardStats()}<section class="panel-grid dashboard-main"><article class="panel"><div class="panel-head"><h2>等级分布</h2><span>数据按小时更新</span></div>${[['LV1 普通用户',88,6340],['LV2—LV5',72,3660],['LV6—LV8',43,1810],['LV9—LV11',18,758],['LV12 超级合伙人',4,112]].map((row) => `<div class="bar-row"><span>${row[0]}</span><div class="bar-track"><i style="width:${row[1]}%"></i></div><b>${row[2]}</b></div>`).join('')}</article><article class="panel"><div class="panel-head"><h2>今日需关注</h2><span>点击进入对应明细</span></div><ul class="warning-list"><li><span>待开通登记</span><b>3</b></li><li><span>计算失败待重算</span><b>3</b></li><li><span>预警即将转休眠</span><b>42</b></li><li><span>店名风险待处理</span><b>1</b></li></ul></article></section><section class="panel-grid dashboard-secondary"><article class="panel"><div class="panel-head"><h2>本月升级流向</h2><span>共642人</span></div><div class="flow-list">${[['LV1 → LV2',168,72],['LV2 → LV3',146,63],['LV4 → LV5',112,49],['LV7 → LV8',84,36],['LV10 → LV11',32,14]].map((row) => `<div><span>${row[0]}</span><i><b style="width:${row[2]}%"></b></i><strong>${row[1]}人</strong></div>`).join('')}</div></article><article class="panel"><div class="panel-head"><h2>临门等级分布</h2><span>下一级完成度 ≥ 80%</span></div><div class="near-levels"><article><strong>426</strong><span>待升 LV2</span></article><article><strong>318</strong><span>待升 LV5</span></article><article><strong>246</strong><span>待升 LV8</span></article><article><strong>86</strong><span>已达标</span></article></div><button class="text-button" data-section="owners">查看临门店主明细 →</button></article><article class="panel health-panel"><div class="panel-head"><h2>等级计算健康度</h2><span>近24小时</span></div><strong>99.96%</strong><div class="health-line"><i style="width:99.96%"></i></div><p>共执行 128,406 次，平均耗时 182 毫秒，3 条失败记录待处理。</p><button class="text-button" data-section="tasks">前往计算日志 →</button></article></section>`;
  }

  function renderLevels() {
    const rows = levels.filter((row) => !state.search || `${row.level}${row.identity}${row.condition}`.includes(state.search));
    return `${pageHead('<button class="button" data-tab="versions">查看版本历史</button><button class="primary-button" data-open-publish>发布新版本</button>')}<section class="rule-summary"><article><span>启用等级</span><strong>${levels.filter((row) => row.enabled).length} / 12</strong><small>包含 LV1 固定等级</small></article><article><span>自动升级</span><strong>${levels.filter((row) => row.upgradeMode === '自动升级' && row.enabled).length}</strong><small>等级计算达标后自动生效</small></article><article><span>暂停等级</span><strong>${levels.filter((row) => !row.enabled).length}</strong><small>暂停后不产生新升级</small></article><article class="pending"><span>待发布修改</span><strong>${state.pendingChanges}</strong><small>门槛、权益或店铺收益方案变更</small></article></section><div class="draft-banner"><span><b>当前生效版本 ${state.version}</b> · 修改先保存为待发布内容，发布新版本后生效</span><button type="button" data-tab="versions">查看历史 →</button></div><div class="filter-bar"><input type="search" data-table-search placeholder="搜索等级或身份" value="${state.search}"><select><option>全部升级方式</option><option>自动升级</option><option>线下联系</option></select><span class="filter-meta">共 12 个等级</span></div><section class="data-table"><div class="table-row head level-table"><span>等级</span><span>身份</span><span>升级条件</span><span>本级新增权益</span><span>店铺收益方案版本</span><span>升级方式</span><span>开关</span><span>操作</span></div>${rows.map((row) => `<div class="table-row level-table"><strong>LV${row.level}</strong><span>${row.identity}</span><span class="condition-summary">${row.condition}<small>${row.relation}</small></span><span>${row.benefits}</span><span><strong>${row.commission}</strong><small>按订单快照生效</small></span><span>${row.upgradeMode}</span>${pill(row.enabled ? '已开启' : '已暂停')}${row.level === 1 ? '<button type="button" data-toast="LV1为固定等级，不可编辑">查看</button>' : `<button type="button" data-edit-level="${row.level}">编辑</button>`}</div>`).join('')}</section>`;
  }

  function renderVersions() {
    const rows = [...versionHistory].reverse();
    return `${pageHead('<button class="primary-button" data-open-publish>发布新版本</button>')}<section class="version-summary"><div><span>当前生效</span><strong>版本 ${state.version}</strong><small>全部店主使用当前有效规则</small></div><div><span>历史版本</span><strong>${Math.max(0, versionHistory.length - 1)}</strong><small>配置永久留痕，不覆盖删除</small></div></section><section class="data-table"><div class="table-row head version-table"><span>版本</span><span>状态</span><span>变更摘要</span><span>生效时间</span><span>操作人</span><span>操作</span></div>${rows.map((row, index) => `<div class="table-row version-table"><strong>版本 ${row.version}</strong>${pill(row.status)}<span>${row.summary}<small>创建于 ${row.createdAt}</small></span><span>${row.effectiveAt}</span><span>${row.operator}</span><div class="row-actions"><button data-version-detail="${row.version}">详情</button>${index < rows.length - 1 ? `<button data-version-compare="${row.version}">对比</button>` : ''}</div></div>`).join('')}</section>`;
  }

  function onlineReferencedBenefitIds() {
    return [...new Set(levels.flatMap((level) => level.benefitIds))];
  }

  function benefitReferences(id) {
    return levels.filter((level) => level.benefitIds.includes(id)).map((level) => `LV${level.level}`);
  }

  function benefitCategoryTone(category) {
    return { '收益类': 'revenue', '运营类': 'operation', '鉴定类': 'appraisal' }[category] || '';
  }

  function renderBenefits() {
    const rows = model.sortBenefits(benefits).filter((row) => !state.search || `${row.name}${row.category}${row.shortDescription}${row.source}`.includes(state.search));
    const categories = ['收益类', '运营类', '鉴定类'];
    const groupedRows = categories.map((category) => {
      const categoryRows = rows.filter((row) => row.category === category);
      if (!categoryRows.length) return '';
      return `<div class="benefit-category-row ${benefitCategoryTone(category)}"><span>${category}</span><small>${categoryRows.length} 项 · 类别顺序固定，仅可调整组内展示顺序</small></div>${categoryRows.map((row) => {
        const references = benefitReferences(row.id);
        const referenced = references.length > 0;
        return `<div class="table-row benefit-table" draggable="true" data-benefit-row="${row.id}" data-benefit-drag="${row.id}" data-benefit-category="${row.category}"><button type="button" class="drag-handle" aria-label="拖拽调整${row.name}排序" title="仅可在${row.category}内拖拽排序">⋮⋮</button><span class="benefit-name"><i>${row.icon || '权'}</i><span><strong>${row.name}</strong><small>${row.id} · ${row.shortDescription || row.description}</small></span></span><span><strong>${row.order}</strong><small>展示排序</small></span><span class="reference-summary">${referenced ? `<strong>${references.slice(0, 4).join('、')}${references.length > 4 ? '等' : ''}</strong><small>当前线上版本引用</small>` : '<strong>未引用</strong><small>可停用或删除</small>'}</span>${pill(row.status)}<div class="sort-controls"><button data-sort-benefit="${row.id}" data-sort-direction="-1" title="上移">↑</button><button data-sort-benefit="${row.id}" data-sort-direction="1" title="下移">↓</button></div><div class="row-actions"><button data-view-benefit="${row.id}">查看</button><button data-edit-benefit="${row.id}">编辑</button><button data-toggle-benefit="${row.id}" ${referenced && row.status === '生效中' ? 'class="locked-action" title="当前线上版本引用中"' : ''}>${row.status === '生效中' ? '停用' : '恢复'}</button><button class="danger-link ${referenced ? 'locked-action' : ''}" data-delete-benefit="${row.id}" ${referenced ? 'title="当前线上版本引用中"' : ''}>删除</button></div></div>`;
      }).join('')}`;
    }).join('');
    return `${pageHead('<button class="button" data-tab="issuance">权益发放记录</button><button class="primary-button" data-new-benefit>新建权益</button>')}<div class="draft-banner rights-banner"><span><b>权益库 V2</b> · 前台展示顺序为收益类 → 运营类 → 鉴定类，类别顺序不可修改</span><span>修改内容随下一个规则版本发布</span></div><div class="filter-bar"><input type="search" data-table-search placeholder="搜索权益名称或类别" value="${state.search}"><select><option>全部类别</option><option>收益类</option><option>运营类</option><option>鉴定类</option></select><span class="filter-meta">共 ${rows.length} 项权益</span></div><section class="data-table benefit-library"><div class="table-row head benefit-table"><span></span><span>权益名称</span><span>展示排序</span><span>当前引用</span><span>状态</span><span>组内排序</span><span>操作</span></div>${groupedRows}</section><p class="sort-note">排序说明：拖拽或使用上下按钮仅会改变同一类别中的展示顺序；被当前线上版本引用的权益不可停用或删除。</p>`;
  }

  function renderIssuance() {
    const rows = issuanceRows.filter((row) => !state.search || `${row.id}${row.agent}${row.benefit}${row.status}`.includes(state.search));
    const active = issuanceRows.filter((row) => row.status === '生效中').length;
    const paused = issuanceRows.filter((row) => row.status === '已暂停').length;
    const expired = issuanceRows.filter((row) => row.status === '已失效').length;
    return `${pageHead('<button class="button" data-tab="benefits">返回权益库</button><button class="primary-button" data-toast="发放记录已导出">导出发放明细</button>')}<section class="stat-grid issuance-stats"><article class="stat-card"><div class="stat-card-head"><span>累计发放</span><i>发</i></div><strong>18,642</strong><small>当前筛选 ${rows.length} 条示例</small></article><article class="stat-card"><div class="stat-card-head"><span>生效中</span><i>生</i></div><strong>${active}</strong><small>持续享有对应权益</small></article><article class="stat-card"><div class="stat-card-head"><span>已暂停</span><i>暂</i></div><strong>${paused}</strong><small class="warning">可填写原因后恢复</small></article><article class="stat-card"><div class="stat-card-head"><span>已失效</span><i>止</i></div><strong>${expired}</strong><small>历史记录永久保留</small></article></section><div class="filter-bar"><input type="search" data-table-search placeholder="搜索店主、权益或发放编号" value="${state.search}"><select><option>全部发放状态</option><option>生效中</option><option>已暂停</option><option>已失效</option></select><select><option>全部发放来源</option><option>等级自动发放</option><option>运营补发</option></select><span class="filter-meta">权益由等级规则自动发放，本页不提供“领取”</span></div><section class="data-table"><div class="table-row head issuance-table"><span>发放编号 / 店主</span><span>权益</span><span>来源等级</span><span>发放时间 / 有效期</span><span>规则版本</span><span>状态</span><span>操作</span></div>${rows.map((row) => `<div class="table-row issuance-table"><span><strong>${row.id}</strong><small>${row.agent}</small></span><span><strong>${row.benefit}</strong><small>${row.benefitId}</small></span><span>${row.sourceLevel}<small>等级自动发放</small></span><span>${row.grantAt}<small>${row.effective}</small></span><span>版本 ${row.version}</span>${pill(row.status)}<div class="row-actions"><button data-view-issuance="${row.id}">查看</button>${row.status === '生效中' ? `<button data-issuance-action="暂停" data-issuance-id="${row.id}">暂停</button>` : row.status === '已暂停' ? `<button data-issuance-action="恢复" data-issuance-id="${row.id}">恢复</button>` : '<span>—</span>'}</div></div>`).join('')}</section>`;
  }

  function renderAgents() {
    const rows = agents.filter((row) => !state.search || `${row.name}${row.id}${row.phone}`.includes(state.search));
    return `${pageHead('<button class="button" data-toast="店主明细已导出">下载当前明细</button>')}<div class="filter-bar"><input type="search" data-table-search placeholder="搜索店主、店铺、编号或手机号" value="${state.search}"><select><option>全部等级</option><option>LV2—LV5</option><option>LV6—LV8</option><option>LV9—LV12</option></select><select><option>全部状态</option><option>正常</option><option>预警</option><option>休眠</option></select><span class="filter-meta">共12,680名店主</span></div><section class="data-table"><div class="table-row head owner-table"><span>店主 / 店铺</span><span>等级</span><span>状态</span><span>客户 / 团队订单</span><span>已结算店铺收益</span><span>开通时间</span><span>操作</span></div>${rows.map((row) => `<div class="table-row owner-table"><span><strong>${row.name}</strong><small>${row.storeName} · ${row.id} · ${row.phone}</small></span><span><strong>${row.level}</strong><small>${row.identity}</small></span>${pill(row.status)}<span>${row.customers}人 / ${row.orders}笔<small>进度 ${row.progress}</small></span><strong>${row.commission}</strong><span>${row.openedAt}</span><button data-agent-detail="${row.id}">详情</button></div>`).join('')}</section>`;
  }

  function renderRegistrations() {
    const rows = registrations.filter((row) => !state.search || `${row.realName}${row.phone}${row.wechat}${row.city}${row.storeName}`.includes(state.search));
    const pending = registrations.filter((row) => !row.opened).length;
    return `${pageHead('<button class="button" data-toast="开店登记已导出">导出登记</button>')}<section class="registration-summary"><article><span>待开通</span><strong>${pending}</strong><small>资料异常线下沟通</small></article><article><span>今日登记</span><strong>18</strong><small>重复登记更新原记录</small></article><article><span>今日开通</span><strong>11</strong><small>单次事务生成LV2与资料</small></article><article><span>风险提示</span><strong>1</strong><small>同手机号多账号</small></article></section><div class="scope-note"><b>当前为人工开通，不建设审批流</b><span>点击“开通店主”后创建LV2成长店主、店铺资料和初始权益；重复操作保持幂等。</span></div><div class="filter-bar"><input type="search" data-table-search placeholder="搜索用户、手机号、微信号、城市或店名" value="${state.search}"><select><option>全部开通状态</option><option>待开通</option><option>已开通</option></select><span class="filter-meta">共 ${rows.length} 条示例登记</span></div><section class="data-table"><div class="table-row head registration-table"><span>用户 / 联系方式</span><span>城市 / 申请店名</span><span>提交时间 / 渠道</span><span>风险提示</span><span>开通状态</span><span>操作人 / 时间</span><span>操作</span></div>${rows.map((row) => `<div class="table-row registration-table"><span><strong>${row.realName}（${row.nickname}）</strong><small>${row.phone} · 微信号 ${row.wechat}</small></span><span>${row.city}<small>${row.storeName || '未填写，将使用默认名称'}</small></span><span>${row.submittedAt}<small>${row.channel}</small></span><span>${row.risk ? `<b class="risk-text">${row.risk}</b>` : '—'}</span>${pill(row.opened ? '已开通' : '待开通')}<span>${row.operator || '—'}<small>${row.operatedAt || '—'}</small></span><div class="row-actions"><button data-registration-detail="${row.id}">查看</button>${row.opened ? '<span>已完成</span>' : `<button class="primary-link" data-open-owner="${row.id}">开通店主</button>`}</div></div>`).join('')}</section>`;
  }

  function renderStores() {
    const rows = storeProfiles.filter((row) => !state.search || `${row.ownerName}${row.storeName}${row.storeNumber}`.includes(state.search));
    return `${pageHead('<button class="button" data-toast="店铺资料已导出">导出店铺资料</button>')}<div class="scope-note"><b>店铺资料与店主身份一对一</b><span>店铺直接继承店主状态；当前仅允许后台改名，不创建商品、库存、装修或独立资金账户。</span></div><div class="filter-bar"><input type="search" data-table-search placeholder="搜索店主、店铺名称或店铺编号" value="${state.search}"><select><option>全部店铺状态</option><option>正常</option><option>预警</option><option>休眠</option></select><span class="filter-meta">共 ${rows.length} 份示例资料</span></div><section class="data-table"><div class="table-row head store-table"><span>店铺名称 / 编号</span><span>店主</span><span>等级</span><span>状态</span><span>开通时间</span><span>名称变更记录</span><span>操作</span></div>${rows.map((row) => `<div class="table-row store-table"><span><strong>${row.storeName}</strong><small>${row.storeNumber}</small></span><span>${row.ownerName}<small>${row.ownerId || row.userId}</small></span><span>LV${row.level}<small>${row.identity}</small></span>${pill(row.status)}<span>${row.openedAt}<small>${row.operator} 开通</small></span><span>${row.nameHistory.length} 条<small>${row.nameHistory.length ? `最近：${row.nameHistory.at(-1).time}` : '暂无变更'}</small></span><div class="row-actions"><button data-store-detail="${row.id}">查看</button><button data-rename-store="${row.id}">修改店名</button></div></div>`).join('')}</section>`;
  }

  function renderContentManagement() {
    const rows = contentRows.filter((row) => !state.search || `${row.title}${row.category}${row.format}${row.level}${row.status}`.includes(state.search));
    return `${pageHead('<button class="primary-button" data-new-content>新建内容</button>')}<section class="content-summary"><article><span>已上架</span><strong>${contentRows.filter((row) => row.status === '已上架').length}</strong><small>小程序内可见</small></article><article><span>草稿</span><strong>${contentRows.filter((row) => row.status === '草稿').length}</strong><small>尚未对外展示</small></article><article><span>等级锁定</span><strong>${contentRows.filter((row) => row.level !== 'LV2及以上').length}</strong><small>前台展示解锁条件</small></article></section><div class="scope-note"><b>培训素材内容管理</b><span>统一维护发圈工具、视频素材和学习资料；仅提供图文、视频、复制、保存和等级权限，不建设课程进度与考试。</span></div><div class="filter-bar"><input type="search" data-table-search placeholder="搜索标题、分类或可见等级" value="${state.search}"><select><option>全部分类</option><option>发圈工具</option><option>视频素材</option><option>学习资料</option></select><select><option>全部上下架状态</option><option>已上架</option><option>草稿</option><option>已下架</option></select><span class="filter-meta">共 ${rows.length} 条内容</span></div><section class="data-table"><div class="table-row head content-table"><span>标题 / 编号</span><span>分类 / 形式</span><span>展示排序</span><span>可见等级</span><span>关联权益</span><span>上下架状态</span><span>操作</span></div>${rows.map((row) => `<div class="table-row content-table"><span><strong>${row.title}</strong><small>${row.id} · 更新于 ${row.updatedAt}</small></span><span>${row.category}<small>${row.format}</small></span><strong>${row.order}</strong><span>${row.level}</span><span>${row.benefit}</span>${pill(row.status)}<div class="row-actions"><button data-edit-content="${row.id}">编辑</button><button data-toggle-content="${row.id}">${row.status === '已上架' ? '下架' : '上架'}</button></div></div>`).join('')}</section>`;
  }

  function renderAppeals() {
    return `${pageHead()}<div class="filter-bar"><select><option>全部处理状态</option><option>待受理</option><option>处理中</option><option>待复核</option></select><span class="filter-meta">申诉来自现有客服或线下渠道</span></div><section class="data-table"><div class="table-row head appeal-table"><span>店主</span><span>当前状态</span><span>申诉内容</span><span>处理进度</span><span>处理人</span><span>操作</span></div>${appeals.map((row, index) => `<div class="table-row appeal-table"><strong>${row.agent}</strong>${pill(row.status)}<span>${row.reason}</span>${pill(row.progress)}<span>${row.owner}</span><button data-appeal="${index}">处理</button></div>`).join('')}</section>`;
  }

  function renderStatuses() {
    const cards = [
      ['正常','全部有效权益生效','默认状态','正常经营，所有功能可用','系统或人工恢复'],
      ['预警','等级和权益暂不变化','提前30天提示','长时间未有效经营，请尽快恢复','有效经营后自动恢复'],
      ['休眠','暂停升级和新增店主','90天无有效经营','当前处于休眠状态，历史收益保留','有效经营或申诉通过'],
      ['限权','按个体选择限制能力','特定风险','部分店主能力暂时受限','风险复核通过'],
      ['冻结','暂停新增经营和新店铺收益','严重异常','账户已冻结，请根据提示申诉','仅限人工复核'],
      ['终止','停止新绑定与新店铺收益','资格终止','店主资格已终止','不可自动恢复'],
      ['已退出','经营能力关闭，历史只读','退出完成','店主资格已退出，历史数据可查','不可恢复'],
    ];
    const reasons = [['S01','长期无有效经营','预警、休眠','系统判定'],['S02','风险审核要求限制部分能力','限权','风控人工'],['S03','交易或身份材料存在重大异常','冻结','风控人工'],['S04','店主主动退出','终止、已退出','运营人工'],['S05','申诉复核通过','正常','运营或风控']];
    return `${pageHead('<button class="primary-button" data-toast="状态规则草稿已保存">保存规则</button>')}<div class="draft-banner"><span><b>7类状态影响模板</b> · 每个状态统一维护前台文案、权益影响与恢复方式</span><span>个体限权项在店主详情中设置</span></div><section class="state-grid">${cards.map((row) => `<article class="state-card"><header><h3>${row[0]}</h3>${pill(row[2])}</header><p><b>权益影响</b>${row[1]}</p><p><b>前台文案</b>${row[3]}</p><footer><span>恢复：${row[4]}</span><button type="button" data-state-rule="${row[0]}">编辑规则</button></footer></article>`).join('')}</section><section class="panel status-settings"><div class="panel-head"><h2>自动预警与休眠规则</h2><span>全部店主使用同一套规则</span></div><div class="field-row equal"><div class="field"><label>预警观察周期</label><input value="连续60天无有效经营"></div><div class="field"><label>休眠观察周期</label><input value="连续90天无有效经营"></div></div></section><section class="panel reason-library"><div class="panel-head"><h2>标准原因库</h2><button class="button" data-toast="新增标准原因已进入草稿">＋ 新增原因</button></div><div class="data-table"><div class="table-row head reason-table"><span>编号</span><span>标准原因</span><span>适用状态</span><span>判定方式</span><span>操作</span></div>${reasons.map((row) => `<div class="table-row reason-table"><strong>${row[0]}</strong><span>${row[1]}</span><span>${row[2]}</span><span>${row[3]}</span><button data-toast="标准原因编辑抽屉已打开">编辑</button></div>`).join('')}</div></section>`;
  }

  function renderLogs() {
    const failed = logs.filter((row) => row.status === '失败').length;
    return `${pageHead('<button class="button" data-retry-all>批量重算失败记录</button>')}<section class="rule-summary log-summary"><article><span>今日执行</span><strong>128,406</strong><small>周期校准与事件触发</small></article><article><span>成功率</span><strong>99.96%</strong><small>较昨日 +0.02%</small></article><article><span>平均耗时</span><strong>182毫秒</strong><small>95%请求小于300毫秒</small></article><article class="pending"><span>待处理失败</span><strong>${failed}</strong><small>重算保留原始记录</small></article></section><div class="filter-bar"><input type="search" placeholder="搜索店主或日志编号"><select><option>全部结果</option><option>成功</option><option>失败</option></select><select><option>全部触发来源</option><option>周期校准</option><option>订单结算</option><option>状态变化</option></select><span class="filter-meta">明细实时更新</span></div><section class="data-table"><div class="table-row head log-table"><span>日志编号</span><span>店主</span><span>触发来源</span><span>计算结果</span><span>规则版本</span><span>执行信息</span><span>操作</span></div>${logs.map((row) => `<div class="table-row log-table"><span><strong>${row.id}</strong><small>第${row.attempt}次执行</small></span><span>${row.agent}</span><span>${row.source}</span><span><strong>${row.result}</strong><small>${row.status === '失败' ? `失败步骤：${row.failStep}` : '指标快照已保存'}</small></span><span>${row.version}</span><span>${row.time}<small>${row.duration} · ${row.status}</small></span><div class="row-actions"><button data-log-detail="${row.id}">查看</button>${row.status === '失败' ? `<button data-retry-log="${row.id}">重算</button>` : ''}</div></div>`).join('')}</section>`;
  }

  function renderMigration() {
    const mapping = [['成长店主','LV2','2,684'],['轻享店主','LV5','6,420'],['星享店主','LV8','2,460'],['超级店主','LV11','1,004'],['超级合伙人','LV12','112']];
    const resultCopy = state.migrationStep ? ['','试跑完成：12,680人可迁移，0人无映射，86人迁移后立即满足下一级。','正式迁移完成：12,677人成功，3人失败待重跑，自动升级仍保持关闭。','结果校验完成：失败记录已重跑，异常为0，可启用自动升级。'][state.migrationStep] : '请先执行试跑，确认映射、数量和影响范围。';
    return `${pageHead()}<section class="migration-hero"><div><h2>存量店主等效迁移</h2><p>成长店主 → LV2 · 轻享店主 → LV5 · 星享店主 → LV8 · 超级店主 → LV11 · 超级合伙人 → LV12</p></div><div class="migration-steps"><button data-migration="1" class="${state.migrationStep === 1 ? 'active' : ''}">1. 执行试跑</button><button data-migration="2" class="${state.migrationStep === 2 ? 'active' : ''}" ${state.migrationStep < 1 ? 'disabled' : ''}>2. 正式迁移</button><button data-migration="3" class="${state.migrationStep === 3 ? 'active' : ''}" ${state.migrationStep < 2 ? 'disabled' : ''}>3. 结果校验</button></div></section><section class="mapping-grid">${mapping.map((row) => `<article><span>${row[0]}</span><b>→</b><strong>${row[1]}</strong><small>${row[2]}人</small></article>`).join('')}</section><section class="rule-summary migration-summary"><article><span>待迁移</span><strong>12,680</strong><small>全部存量店主</small></article><article><span>映射完整度</span><strong>100%</strong><small>所有老身份均有目标等级</small></article><article><span>预计立即满足下一级</span><strong>86</strong><small>迁移后仅记录，不立即升级</small></article><article class="pending"><span>未处理异常</span><strong>${state.migrationStep === 2 ? 3 : 0}</strong><small>全部清零后才可开启自动升级</small></article></section><section class="panel migration-result"><div class="panel-head"><h2>最近执行结果</h2><span>${state.migrationStep ? '步骤已记录' : '尚未执行'}</span></div><p>${resultCopy}</p><div class="migration-condition"><strong>自动升级启用条件</strong><span class="${state.migrationStep === 3 ? 'ready' : ''}">迁移完成 · 异常清零 · 结果校验通过</span></div></section>`;
  }

  function render() {
    renderNavigation();
    const views = { dashboard: renderDashboard, owners: renderAgents, registrations: renderRegistrations, stores: renderStores, levels: renderLevels, versions: renderVersions, benefits: renderBenefits, issuance: renderIssuance, statuses: renderStatuses, content: renderContentManagement, logs: renderLogs, migration: renderMigration };
    content.innerHTML = (views[state.tab] || renderLevels)();
    autoUpgrade.checked = state.autoUpgrade;
  }

  function openDrawer(title, kicker, body, footer = '') {
    drawerTitle.textContent = title;
    drawerKicker.textContent = kicker;
    drawerBody.innerHTML = body;
    drawerFooter.innerHTML = footer;
    drawer.classList.add('open');
    drawerBackdrop.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    drawerBackdrop.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    state.editingLevel = null;
    state.editingBenefit = null;
    state.editingIssuance = null;
    state.issuanceAction = null;
  }

  function levelBenefitChips() {
    return state.levelBenefitDraft.map((id) => {
      const item = benefits.find((benefit) => benefit.id === id);
      return item ? `<span>${item.name}<button type="button" data-remove-level-benefit="${id}" aria-label="移除${item.name}">×</button></span>` : '';
    }).join('');
  }

  function renderLevelDrawer() {
    const row = levels.find((item) => item.level === state.editingLevel);
    const names = ['有效成交客户', '团队有效订单', '累计已结算店铺收益'];
    const units = ['人', '笔', '元'];
    drawerBody.innerHTML = `<section class="form-section"><div class="form-section-title"><strong>升级条件</strong><span>固定三类经营结果</span></div>${names.map((name, index) => `<div class="field"><label>${name}</label><div class="field-row"><button class="condition-switch active" type="button" data-condition-toggle="${index}" aria-pressed="true"><i></i><span>已启用</span></button><label class="input-with-unit"><input type="number" min="0" value="${row.targets[index]}" data-level-target="${index}" aria-label="${name}门槛"><span>${units[index]}</span></label></div></div>`).join('')}<div class="field"><label>条件关系</label><select id="level-relation"><option ${row.relation === '全部满足' ? 'selected' : ''}>全部满足</option><option ${row.relation === '任一满足' ? 'selected' : ''}>任一满足</option></select></div></section><section class="form-section"><div class="form-section-title"><strong>店铺收益与权益</strong><span>绑定指定版本</span></div><div class="field"><label>店铺收益方案版本</label><select id="level-commission"><option>${row.commission}</option><option>方案2.0</option><option>方案2.3</option></select></div><div class="field"><label>增量权益</label><div class="benefit-preview editable">${levelBenefitChips()}<button type="button" class="add-benefit-button" data-add-level-benefit>＋ 添加权益</button></div></div></section><section class="form-section"><div class="form-section-title"><strong>完整权益预览</strong><span>包含继承权益</span></div><div class="benefit-preview inherited"><span>基础推广</span><span>回收钱包</span>${levelBenefitChips()}</div></section>`;
  }

  function openLevelDrawer(level) {
    const row = levels.find((item) => item.level === level);
    state.editingLevel = level;
    state.levelBenefitDraft = row.benefitIds.slice();
    openDrawer(`编辑 LV${level} 规则`, '等级规则配置', '', `<button class="button" data-close-drawer>取消</button><button class="primary-button" data-save-level="${level}">保存修改</button>`);
    renderLevelDrawer();
  }

  function openBenefitPicker() {
    state.benefitPickerSelected = new Set(state.levelBenefitDraft);
    benefitPickerSearch.value = '';
    renderBenefitPicker();
    benefitPickerModal.hidden = false;
  }

  function renderBenefitPicker() {
    const keyword = benefitPickerSearch.value.trim();
    const rows = benefits.filter((item) => !keyword || `${item.name}${item.category}`.includes(keyword));
    benefitPickerList.innerHTML = rows.map((item) => `<label class="benefit-option ${item.status === '已暂停' ? 'disabled' : ''}"><input type="checkbox" value="${item.id}" data-benefit-option ${state.benefitPickerSelected.has(item.id) ? 'checked' : ''} ${item.status === '已暂停' ? 'disabled' : ''}><span><strong>${item.name}</strong><small>${item.category} · ${item.source}</small></span>${pill(item.status)}</label>`).join('');
    benefitPickerCount.textContent = `已选择 ${state.benefitPickerSelected.size} 项`;
  }

  function openBenefitDrawer(mode, id) {
    const item = id ? benefits.find((benefit) => benefit.id === id) : {
      name: '', category: '运营类', icon: '权', order: 30, shortDescription: '', detailDescription: '', link: '',
      grantMode: '达成等级后自动发放', validity: '保持对应等级期间有效', businessRule: '', source: '按等级配置', historyReferences: '无', status: '生效中',
    };
    state.benefitMode = mode;
    state.editingBenefit = id || null;
    const readOnly = mode === 'view';
    const references = id ? benefitReferences(id) : [];
    const disabled = readOnly ? 'disabled' : '';
    const body = `<section class="form-section"><div class="form-section-title"><strong>前台展示信息</strong><span>${readOnly ? '只读查看' : '作为下一版本的待发布修改'}</span></div><div class="field-row equal"><div class="field"><label>权益名称</label><input id="benefit-name" value="${item.name}" ${disabled} placeholder="请输入权益名称"></div><div class="field"><label>图标文字</label><input id="benefit-icon" value="${item.icon || '权'}" ${disabled} maxlength="2" placeholder="1至2个中文字"></div></div><div class="field-row equal"><div class="field"><label>权益类别</label><select id="benefit-category" ${disabled}>${['收益类','运营类','鉴定类'].map((value) => `<option ${item.category === value ? 'selected' : ''}>${value}</option>`).join('')}</select></div><div class="field"><label>展示排序</label><input id="benefit-order" type="number" min="1" step="10" value="${item.order || 10}" ${disabled}></div></div><div class="field"><label>短说明</label><input id="benefit-short-description" value="${item.shortDescription || item.description || ''}" ${disabled} placeholder="用于权益卡片摘要"></div><div class="field"><label>详细说明</label><textarea id="benefit-detail-description" ${disabled} placeholder="用于权益详情和规则说明">${item.detailDescription || item.description || ''}</textarea></div><div class="field"><label>前台去使用跳转</label><input id="benefit-link" value="${item.link || ''}" ${disabled} placeholder="例如：我的回收店-培训素材"></div></section><section class="form-section"><div class="form-section-title"><strong>业务规则</strong><span>调整需随等级规则版本发布</span></div><div class="field"><label>发放方式</label><select id="benefit-grant-mode" ${disabled}><option ${item.grantMode === '达成等级后自动发放' ? 'selected' : ''}>达成等级后自动发放</option><option ${item.grantMode === '达成等级后按月发放' ? 'selected' : ''}>达成等级后按月发放</option><option ${item.grantMode === '运营补发' ? 'selected' : ''}>运营补发</option></select></div><div class="field"><label>有效期规则</label><input id="benefit-validity" value="${item.validity || ''}" ${disabled}></div><div class="field"><label>生效口径</label><textarea id="benefit-business-rule" ${disabled} placeholder="说明生效、扣减、结转或结算规则">${item.businessRule || ''}</textarea></div><div class="field-row equal"><div class="field"><label>前台开放范围</label><input id="benefit-source" value="${item.source || ''}" ${disabled} placeholder="例如：LV3起"></div><div class="field"><label>当前状态</label><select id="benefit-status" ${disabled}><option ${item.status === '生效中' ? 'selected' : ''}>生效中</option><option ${item.status === '已暂停' ? 'selected' : ''}>已暂停</option></select></div></div></section>${id ? `<section class="form-section reference-box"><div class="form-section-title"><strong>当前引用</strong><span>${references.length ? '线上版本正在使用' : '当前线上版本未引用'}</span></div><div class="reference-detail"><div><span>线上等级</span><strong>${references.length ? references.join('、') : '无'}</strong></div><div><span>历史版本</span><strong>${item.historyReferences || '无'}</strong></div></div>${references.length ? '<p class="locked-note">该权益不可停用或删除；如需停用，请先在新版本中移除全部等级引用。</p>' : '<p>未被当前线上版本引用，可停用或删除。</p>'}</section>` : ''}`;
    const footer = readOnly ? '<button class="primary-button" data-close-drawer>关闭</button>' : `<button class="button" data-close-drawer>取消</button><button class="primary-button" data-save-benefit>${mode === 'create' ? '创建权益' : '保存修改'}</button>`;
    openDrawer(readOnly ? `查看权益 · ${item.name}` : mode === 'create' ? '新建权益' : `编辑权益 · ${item.name}`, '权益库管理', body, footer);
  }

  function openIssuanceDetail(id) {
    const item = issuanceRows.find((row) => row.id === id);
    const history = item.history.length ? `<ul class="timeline">${[...item.history].reverse().map((entry) => `<li><strong>${entry.action}权益 · ${entry.time}</strong><span>${entry.reason}</span></li>`).join('')}</ul>` : '<p class="empty-copy">暂无暂停或恢复记录。</p>';
    openDrawer(`发放记录 · ${item.id}`, '权益发放记录', `<section class="form-section"><div class="form-section-title"><strong>发放结果</strong>${pill(item.status)}</div><div class="reference-detail issuance-detail"><div><span>店主</span><strong>${item.agent}</strong></div><div><span>权益</span><strong>${item.benefit}</strong></div><div><span>来源</span><strong>${item.sourceLevel} 等级自动发放</strong></div><div><span>规则版本</span><strong>版本 ${item.version}</strong></div><div><span>发放时间</span><strong>${item.grantAt}</strong></div><div><span>有效期</span><strong>${item.effective}</strong></div></div></section><section class="form-section"><div class="form-section-title"><strong>状态变更记录</strong><span>操作原因永久留存</span></div>${history}</section>`, '<button class="primary-button" data-close-drawer>关闭</button>');
  }

  function openIssuanceAction(id, action) {
    const item = issuanceRows.find((row) => row.id === id);
    state.editingIssuance = id;
    state.issuanceAction = action;
    openDrawer(`${action}权益 · ${item.benefit}`, '权益发放状态变更', `<section class="form-section"><div class="risk-note">${action === '暂停' ? '暂停后店主将无法继续使用该权益，历史使用和发放记录保留。' : '恢复后店主可继续使用该权益，本次操作会写入状态历史。'}</div><div class="reference-detail"><div><span>店主</span><strong>${item.agent}</strong></div><div><span>当前状态</span><strong>${item.status}</strong></div></div><div class="field"><label>${action}原因（必填）</label><textarea id="issuance-reason" placeholder="请输入可追溯的业务原因"></textarea></div></section>`, `<button class="button" data-close-drawer>取消</button><button class="primary-button" data-confirm-issuance-action>确认${action}</button>`);
  }

  function openRegistrationDetail(id) {
    const item = registrations.find((row) => row.id === id);
    openDrawer(`开店登记 · ${item.realName}`, '登记资料', `<section class="form-section"><div class="form-section-title"><strong>登记信息</strong>${pill(item.opened ? '已开通' : '待开通')}</div><div class="reference-detail"><div><span>用户</span><strong>${item.realName}（${item.nickname}）</strong></div><div><span>手机号</span><strong>${item.phone}</strong></div><div><span>微信号</span><strong>${item.wechat}</strong></div><div><span>所在城市</span><strong>${item.city}</strong></div><div><span>申请店名</span><strong>${item.storeName || '未填写'}</strong></div><div><span>运营渠道</span><strong>${item.channel}</strong></div></div></section>${item.risk ? `<section class="form-section"><div class="risk-note"><b>风险提示</b><br>${item.risk}，请运营线下核对后再开通。</div></section>` : ''}<section class="form-section"><div class="form-section-title"><strong>处理边界</strong><span>不建设复杂审批</span></div><ul class="check-list"><li>登记成功不提前创建店主身份</li><li>手动开通创建LV2、店铺资料与初始权益</li><li>重复执行开通返回已有结果</li></ul></section>`, item.opened ? '<button class="primary-button" data-close-drawer>关闭</button>' : `<button class="button" data-close-drawer>取消</button><button class="primary-button" data-open-owner="${item.id}" data-close-drawer>开通店主</button>`);
  }

  function openStoreDetail(id) {
    const item = storeProfiles.find((row) => row.id === id);
    const history = item.nameHistory.length ? `<ul class="timeline">${[...item.nameHistory].reverse().map((entry) => `<li><strong>${entry.before} → ${entry.after}</strong><span>${entry.time} · ${entry.operator} · ${entry.reason}</span></li>`).join('')}</ul>` : '<p class="empty-copy">暂无名称变更记录。</p>';
    openDrawer(`店铺资料 · ${item.storeName}`, '一对一店铺资料', `<section class="form-section"><div class="form-section-title"><strong>基础资料</strong>${pill(item.status)}</div><div class="reference-detail"><div><span>店铺名称</span><strong>${item.storeName}</strong></div><div><span>店铺编号</span><strong>${item.storeNumber}</strong></div><div><span>店主</span><strong>${item.ownerName}</strong></div><div><span>成长等级</span><strong>${item.identity}·LV${item.level}</strong></div><div><span>开通时间</span><strong>${item.openedAt}</strong></div><div><span>开通操作人</span><strong>${item.operator}</strong></div></div></section><section class="form-section"><div class="form-section-title"><strong>名称变更记录</strong><span>店铺标识不随店名变化</span></div>${history}</section><section class="form-section"><div class="scope-note"><b>能力边界</b><span>不创建商品、库存、装修、履约、售后、独立账户或独立店铺状态。</span></div></section>`, `<button class="button" data-close-drawer>关闭</button><button class="primary-button" data-rename-store="${item.id}">修改店名</button>`);
  }

  function openRenameStore(id) {
    const item = storeProfiles.find((row) => row.id === id);
    state.editingStoreId = id;
    openDrawer(`修改店名 · ${item.ownerName}`, '店铺资料维护', `<section class="form-section"><div class="risk-note">店名变化不会改变店铺编号、客户归因、历史订单或店铺收益。</div><div class="field"><label>当前店铺名称</label><input value="${item.storeName}" disabled></div><div class="field"><label>新店铺名称</label><input id="store-new-name" value="${item.storeName}" placeholder="请输入合规店铺名称"></div><div class="field"><label>修改原因（必填）</label><textarea id="store-rename-reason" placeholder="请输入店主申请或运营调整原因"></textarea></div></section>`, '<button class="button" data-close-drawer>取消</button><button class="primary-button" data-save-store-name>保存店名</button>');
  }

  function openContentDrawer(id) {
    const item = id ? contentRows.find((row) => row.id === id) : { title: '', category: '发圈工具', format: '图文', order: 40, level: 'LV2及以上', status: '草稿', benefit: '发圈基础素材' };
    state.editingContentId = id || null;
    openDrawer(id ? `编辑内容 · ${item.title}` : '新建培训素材', '培训素材内容管理', `<section class="form-section"><div class="form-section-title"><strong>基础信息</strong><span>图文与视频均在小程序内查看</span></div><div class="field"><label>标题</label><input id="content-title" value="${item.title}" placeholder="请输入内容标题"></div><div class="field-row equal"><div class="field"><label>分类</label><select id="content-category">${['发圈工具','视频素材','学习资料'].map((value) => `<option ${item.category === value ? 'selected' : ''}>${value}</option>`).join('')}</select></div><div class="field"><label>内容形式</label><select id="content-format"><option ${item.format === '图文' ? 'selected' : ''}>图文</option><option ${item.format === '视频' ? 'selected' : ''}>视频</option></select></div></div><div class="field"><label>图文正文或视频地址</label><textarea id="content-body" placeholder="输入正文或平台内容地址">平台内容示例，不向无权限用户返回正文或文件地址。</textarea></div></section><section class="form-section"><div class="form-section-title"><strong>展示与权限</strong><span>前台锁定卡显示解锁条件</span></div><div class="field-row equal"><div class="field"><label>展示排序</label><input id="content-order" type="number" min="1" value="${item.order}"></div><div class="field"><label>可见等级</label><select id="content-level">${['LV2及以上','LV5及以上','LV8及以上','LV11及以上'].map((value) => `<option ${item.level === value ? 'selected' : ''}>${value}</option>`).join('')}</select></div></div><div class="field"><label>关联权益</label><input id="content-benefit" value="${item.benefit}"></div><div class="field"><label>上下架状态</label><select id="content-status"><option ${item.status === '草稿' ? 'selected' : ''}>草稿</option><option ${item.status === '已上架' ? 'selected' : ''}>已上架</option><option ${item.status === '已下架' ? 'selected' : ''}>已下架</option></select></div></section>`, '<button class="button" data-close-drawer>取消</button><button class="primary-button" data-save-content>保存内容</button>');
  }

  function openAgentDrawer(id) {
    const agent = agents.find((item) => item.id === id);
    state.agentDetailId = id;
    state.agentDetailTab = 'profile';
    openDrawer(`${agent.name} · ${agent.level}`, '店主成长与权益', '', '');
    renderAgentDrawer();
  }

  function renderAgentDrawer() {
    const agent = agents.find((item) => item.id === state.agentDetailId);
    const tabs = [
      { id: 'profile', name: '店铺资料' },
      { id: 'growth', name: '成长与权益' },
      { id: 'income', name: '经营与收益' },
      { id: 'logs', name: '计算日志' },
      { id: 'operations', name: '操作记录' },
    ];
    const tabBar = `<nav class="drawer-tabs">${tabs.map((tab) => `<button type="button" data-agent-detail-tab="${tab.id}" class="${state.agentDetailTab === tab.id ? 'active' : ''}">${tab.name}</button>`).join('')}</nav>`;
    const profile = `<section class="agent-summary"><div><span>店主</span><strong>${agent.name} · ${agent.id}</strong></div><div><span>当前状态</span>${pill(agent.status)}</div><div><span>开通时间</span><strong>${agent.openedAt}</strong></div></section><section class="form-section"><div class="form-section-title"><strong>店铺资料</strong><span>与店主身份一对一</span></div><div class="reference-detail"><div><span>店铺名称</span><strong>${agent.storeName}</strong></div><div><span>店铺编号</span><strong>JX-${agent.id.replace('A','08')}</strong></div><div><span>店主等级</span><strong>${agent.identity}·${agent.level}</strong></div><div><span>手机号</span><strong>${agent.phone}</strong></div></div></section>`;
    const growth = `<section class="agent-summary"><div><span>当前等级</span><strong>${agent.level} · ${agent.identity}</strong></div><div><span>当前状态</span>${pill(agent.status)}</div><div><span>规则版本</span><strong>${state.version}</strong></div></section><section class="form-section next-level-card"><div class="form-section-title"><strong>下一等级进度</strong><span>${agent.progress}</span></div><div class="progress-track"><i style="width:${agent.progress}"></i></div><div class="metric-progress"><div><span>有效成交客户</span><strong>16 / 20 人</strong><i><b style="width:80%"></b></i></div><div><span>团队有效订单</span><strong>${Math.min(agent.orders, 20)} / 20 笔</strong><i><b style="width:${Math.min(agent.orders / 20 * 100, 100)}%"></b></i></div><div><span>累计已结算店铺收益</span><strong>${agent.commission} / ¥10,000</strong><i><b style="width:86%"></b></i></div></div></section><section class="form-section"><div class="form-section-title"><strong>已获权益</strong><span>按当前等级和状态计算</span></div><div class="agent-benefits"><article><i>收</i><span><strong>鞋服业务收益</strong><small>生效中 · LV2发放</small></span></article><article><i>学</i><span><strong>深度线上运营培训</strong><small>生效中 · LV3发放</small></span></article></div></section>`;
    const upgradeHistory = `<section class="form-section"><div class="form-section-title"><strong>升级记录</strong><span>规则与指标快照永久保留</span></div><ul class="timeline"><li><strong>LV3 → LV4 · 2026-07-20 10:26</strong><span>自动升级 · 规则版本0.9 · 三项条件全部满足</span></li><li><strong>LV2 → LV3 · 2026-06-02 11:16</strong><span>自动升级 · 规则版本0.9</span></li><li><strong>LV1 → LV2 · 2026-05-18 09:30</strong><span>完成店主资格开通</span></li></ul></section>`;
    const statusHistory = `<section class="form-section"><div class="form-section-title"><strong>状态记录</strong><span>包含系统与人工调整</span></div><ul class="timeline"><li><strong>预警 → 正常 · 2026-07-28 15:20</strong><span>系统自动恢复 · 近90天有效订单恢复</span></li><li><strong>正常 → 预警 · 2026-07-01 00:00</strong><span>系统规则 · 连续60天无有效订单</span></li></ul></section>`;
    const agentIssuance = issuanceRows.filter((row) => row.agent.includes(agent.id));
    const issuanceHistory = `<section class="form-section"><div class="form-section-title"><strong>权益发放记录</strong><span>${agentIssuance.length} 条</span></div>${agentIssuance.length ? agentIssuance.map((row) => `<article class="issuance-mini"><div><strong>${row.benefit}</strong><small>${row.id} · ${row.grantAt}</small></div>${pill(row.status)}</article>`).join('') : '<p class="empty-copy">暂无权益发放记录。</p>'}</section>`;
    const income = `<section class="form-section"><div class="form-section-title"><strong>经营指标</strong><span>本月 · 数据更新于10:20</span></div><div class="reference-detail"><div><span>有效成交客户</span><strong>${agent.customers}人</strong></div><div><span>团队有效订单</span><strong>${agent.orders}笔</strong></div><div><span>已结算店铺收益</span><strong>${agent.commission}</strong></div><div><span>待结算业务收益</span><strong>¥540.00</strong></div></div></section><section class="form-section commission-card"><div class="form-section-title"><strong>当前店铺收益方案</strong><span>订单快照为准</span></div><div class="reference-detail"><div><span>方案版本</span><strong>方案1.2</strong></div><div><span>主要品类</span><strong>鞋服 6% · 手机 3%</strong></div></div></section>`;
    const calculationLogs = `<section class="form-section"><div class="form-section-title"><strong>计算日志</strong><span>最近3条</span></div><ul class="timeline"><li><strong>周期校准 · 今天10:24</strong><span>规则版本${state.version} · 结果 ${agent.level}</span></li><li><strong>团队订单结算 · 昨天18:32</strong><span>指标快照已保存</span></li></ul></section>`;
    const operations = `<section class="form-section"><div class="form-section-title"><strong>操作记录</strong><span>人工调整永久留痕</span></div>${upgradeHistory}${statusHistory}${issuanceHistory}</section>`;
    const contentByTab = { profile, growth, income, logs: calculationLogs, operations };
    drawerBody.innerHTML = `${tabBar}${contentByTab[state.agentDetailTab]}`;
    drawerFooter.innerHTML = ['profile', 'growth'].includes(state.agentDetailTab) ? '<button class="button" data-agent-action="recalculate">重新计算</button><button class="button" data-agent-action="level">手动调级</button><button class="primary-button" data-agent-action="status">状态调整</button>' : '<button class="primary-button" data-close-drawer>关闭</button>';
  }

  function openAgentAction(action) {
    const agent = agents.find((item) => item.id === state.agentDetailId);
    if (action === 'recalculate') { showToast('等级重新计算已提交，可在任务中心查看'); return; }
    if (action === 'level') {
      openDrawer(`手动调级 · ${agent.name}`, '店主等级调整', `<section class="form-section"><div class="risk-note">手动调级会立即重新计算权益和店铺收益方案，操作将记录在升级历史中。</div><div class="field"><label>目标等级</label><select><option>LV5 轻享店主</option><option>LV3 轻享店主</option></select></div><div class="field"><label>调整原因（必填）</label><textarea placeholder="请输入审批单号或业务原因"></textarea></div></section>`, '<button class="button" data-close-drawer>取消</button><button class="primary-button" data-save-agent>确认调级</button>');
      return;
    }
    openDrawer(`状态调整 · ${agent.name}`, '店主状态调整', `<section class="form-section"><div class="field-row equal"><div class="field"><label>当前状态</label><input value="${agent.status}" disabled></div><div class="field"><label>目标状态</label><select id="agent-target-status">${['正常','预警','休眠','限权','冻结','终止'].map((status) => `<option ${status === agent.status ? 'selected' : ''}>${status}</option>`).join('')}</select></div></div><div class="field"><label>标准原因</label><select><option>近90天无有效经营</option><option>风险审核要求限制部分能力</option><option>申诉复核通过</option><option>其他（需补充备注）</option></select></div><div class="field"><label>限权项</label><div class="check-grid"><label><input type="checkbox" checked> 暂停升级</label><label><input type="checkbox"> 暂停新增店主</label><label><input type="checkbox"> 暂停新店铺收益</label><label><input type="checkbox"> 隐藏运营素材</label></div></div><div class="field-row equal"><div class="field"><label>生效时间</label><select><option>立即生效</option><option>指定时间</option></select></div><div class="field"><label>权益影响</label><input value="保留历史收益，暂停新发放" disabled></div></div><div class="field"><label>内部备注</label><textarea placeholder="仅后台可见"></textarea></div><div class="field"><label>前台文案</label><textarea>您的店主账户状态已调整，如有疑问请联系客服申诉。</textarea></div></section>`, '<button class="button" data-close-drawer>取消</button><button class="primary-button" data-save-agent>确认调整</button>');
  }

  function openAppealDrawer(index) {
    const item = appeals[index];
    openDrawer(`处理申诉 · ${item.agent}`, '店主申诉', `<section class="form-section"><div class="form-section-title"><strong>申诉信息</strong><span>来自客服或线下渠道</span></div><div class="field"><label>申诉内容</label><textarea disabled>${item.reason}</textarea></div><div class="reference-detail"><div><span>当前状态</span><strong>${item.status}</strong></div><div><span>处理进度</span><strong>${item.progress}</strong></div></div></section><section class="form-section"><div class="form-section-title"><strong>处理结果</strong><span>前台意见与内部备注分开留存</span></div><div class="field"><label>处理结论</label><select><option>受理并进入复核</option><option>申诉通过</option><option>申诉驳回</option></select></div><div class="field"><label>前台意见</label><textarea placeholder="店主可见，请使用完整、清晰的处理说明"></textarea></div><div class="field"><label>内部备注</label><textarea placeholder="仅后台可见，输入复核依据和内部判断"></textarea></div></section>`, `<button class="button" data-close-drawer>取消</button><button class="primary-button" data-save-appeal="${index}">保存处理结果</button>`);
  }

  function openStateRuleDrawer(status) {
    openDrawer(`编辑${status}状态规则`, '状态影响模板', `<section class="form-section"><div class="field"><label>前台文案</label><textarea>${status === '正常' ? '当前经营状态正常，权益和升级功能可用。' : `您的店主账户当前为${status}状态，请查看影响说明。`}</textarea></div><div class="field"><label>影响模板</label><div class="check-grid"><label><input type="checkbox" ${status !== '正常' ? 'checked' : ''}> 暂停自动升级</label><label><input type="checkbox"> 暂停新增店主</label><label><input type="checkbox"> 暂停新店铺收益</label><label><input type="checkbox"> 停止新权益发放</label><label><input type="checkbox" checked> 保留历史收益</label><label><input type="checkbox" checked> 保留历史记录查看</label></div></div><div class="field"><label>恢复方式</label><select><option>系统条件满足后自动恢复</option><option>人工复核通过后恢复</option><option>不可恢复</option></select></div></section>`, '<button class="button" data-close-drawer>取消</button><button class="primary-button" data-save-state-rule>保存规则</button>');
  }

  function openLogDetail(id) {
    const row = logs.find((item) => item.id === id);
    openDrawer(`计算记录 · ${row.id}`, '等级计算日志', `<section class="form-section"><div class="form-section-title"><strong>执行结果</strong>${pill(row.status)}</div><div class="reference-detail"><div><span>店主</span><strong>${row.agent}</strong></div><div><span>触发来源</span><strong>${row.source}</strong></div><div><span>规则版本</span><strong>版本 ${row.version}</strong></div><div><span>耗时 / 重试次数</span><strong>${row.duration} / ${row.attempt - 1}次</strong></div></div></section><section class="form-section"><div class="form-section-title"><strong>指标快照</strong><span>触发时数据</span></div><div class="snapshot-box">${row.snapshot}</div></section><section class="form-section"><div class="form-section-title"><strong>计算过程</strong><span>${row.status === '失败' ? '存在失败步骤' : '全部通过'}</span></div><ul class="check-list process-list"><li>加载店主当前等级与状态</li><li class="${row.status === '失败' ? 'failed' : ''}">失败步骤：${row.failStep}</li><li>根据版本 ${row.version} 判定等级</li><li>写入计算结果和指标快照</li></ul></section>`, row.status === '失败' ? `<button class="button" data-close-drawer>关闭</button><button class="primary-button" data-retry-log="${row.id}" data-close-drawer>重新计算</button>` : '<button class="primary-button" data-close-drawer>关闭</button>');
  }

  function openPublish() {
    const preview = model.createPublishPreview({ currentVersion: state.version, affectedAgents: 1268, immediateUpgrades: 86, benefitUpdates: 420 });
    publishContent.innerHTML = `<div class="preview-version"><span>当前版本 ${state.version}</span><b>→</b><span>待发布版本 ${preview.nextVersion}</span></div><div class="impact-grid"><article><span>受影响存量店主</span><strong>${preview.affectedAgents.toLocaleString()}</strong></article><article><span>预计立即升级</span><strong>${preview.immediateUpgrades}</strong></article><article><span>权益更新</span><strong>${preview.benefitUpdates}</strong></article></div><section class="publish-section"><div class="form-section-title"><strong>等级门槛变化</strong><span>${state.pendingChanges} 项待发布修改</span></div><div class="diff-list"><div><span>LV5 团队有效订单</span><del>≥ 18 笔</del><b>→</b><ins>≥ 20 笔</ins></div><div><span>LV8 累计已结算店铺收益</span><del>≥ 36,000 元</del><b>→</b><ins>≥ 40,000 元</ins></div><div><span>LV12 升级方式</span><del>线上申请</del><b>→</b><ins>线下联系</ins></div></div></section><section class="publish-section"><div class="form-section-title"><strong>权益变化</strong><span>前台卡片与发放规则同步更新</span></div><div class="benefit-preview inherited"><span>LV5 新增：手机回收品类</span><span>LV8 新增：每月30条成片素材</span><span>运营类展示顺序已调整</span></div></section><section class="publish-section commission-diff"><div class="form-section-title"><strong>店铺收益方案变化</strong><span>历史订单保留原快照</span></div><div class="version-compare"><article><span>当前方案</span><strong>方案1.2</strong><p>鞋服品类 6%<br>手机品类 3%<br>计佣基数：最终回收价</p></article><i>→</i><article><span>待发布方案</span><strong>方案1.3</strong><p>鞋服品类 6.5%<br>手机品类 3.5%<br>计佣基数：实收净额</p></article></div></section><section class="publish-section"><div class="form-section-title"><strong>发布前校验</strong><span>全部通过</span></div><ul class="check-list"><li>等级门槛不存在倒挂</li><li>升级条件与店铺收益方案完整</li><li>权益引用均有效，无已停用权益</li><li>存量店主影响范围已生成</li></ul></section><section class="publish-section effective-options"><div class="form-section-title"><strong>生效时间</strong><span>发布后生成不可修改的版本记录</span></div><label><input type="radio" name="effective-time" value="now" checked><span><strong>立即生效</strong><small>发布完成后开始使用新规则</small></span></label><label><input type="radio" name="effective-time" value="scheduled"><span><strong>定时生效</strong><small>2026-08-06 00:00，可在生效前取消</small></span></label></section><div class="risk-note">新版本只影响生效后创建的订单，历史订单继续使用原店铺收益方案快照。</div>`;
    publishModal.hidden = false;
  }

  function openInfo(title, kicker, body) {
    infoTitle.textContent = title;
    infoKicker.textContent = kicker;
    infoContent.innerHTML = body;
    infoModal.hidden = false;
  }

  function openVersionDetail(version, compare) {
    const item = versionHistory.find((record) => record.version === version);
    const body = compare ? `<div class="version-compare"><article><span>版本 ${version}</span><strong>调整前</strong><p>LV5 团队订单 ≥ 18<br>权益：基础素材库</p></article><i>→</i><article><span>版本 ${state.version}</span><strong>调整后</strong><p>LV5 团队订单 ≥ 20<br>新增：手机品类、专属素材</p></article></div>` : `<div class="version-detail-grid"><div><span>版本状态</span>${pill(item.status)}</div><div><span>生效时间</span><strong>${item.effectiveAt}</strong></div><div><span>操作人</span><strong>${item.operator}</strong></div><div><span>变更摘要</span><strong>${item.summary}</strong></div></div><ul class="check-list"><li>等级条件配置已保存</li><li>店铺收益方案引用有效</li><li>权益包快照已生成</li></ul>`;
    openInfo(compare ? `版本 ${version} 与 ${state.version} 对比` : `版本 ${version} 详情`, compare ? '版本差异' : '版本记录', body);
  }

  function openConfirm(title, message, actionLabel, action) {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmAction.textContent = actionLabel;
    state.confirmAction = action;
    confirmModal.hidden = false;
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2000);
  }

  function changeSection(section) {
    const item = menu.children.find((child) => child.id === section);
    if (!item) return;
    state.section = section;
    state.tab = item.defaultTab;
    state.search = '';
    render();
  }

  document.addEventListener('click', (event) => {
    const sectionButton = event.target.closest('[data-section]');
    const tabButton = event.target.closest('[data-tab]');
    if (sectionButton) { event.preventDefault(); changeSection(sectionButton.dataset.section); }
    if (tabButton) { state.tab = tabButton.dataset.tab; state.search = ''; render(); }
    if (event.target.closest('[data-menu-group]')) { state.menuOpen = !state.menuOpen; renderNavigation(); }

    const editLevel = event.target.closest('[data-edit-level]');
    if (editLevel) openLevelDrawer(Number(editLevel.dataset.editLevel));
    const conditionToggle = event.target.closest('[data-condition-toggle]');
    if (conditionToggle) { const active = conditionToggle.classList.toggle('active'); conditionToggle.setAttribute('aria-pressed', String(active)); conditionToggle.querySelector('span').textContent = active ? '已启用' : '已停用'; }
    if (event.target.closest('[data-add-level-benefit]')) openBenefitPicker();
    const removeBenefit = event.target.closest('[data-remove-level-benefit]');
    if (removeBenefit) { state.levelBenefitDraft = state.levelBenefitDraft.filter((id) => id !== removeBenefit.dataset.removeLevelBenefit); renderLevelDrawer(); }
    if (event.target.closest('[data-confirm-benefit-picker]')) { state.levelBenefitDraft = model.mergeBenefitSelection([], [...state.benefitPickerSelected]); benefitPickerModal.hidden = true; renderLevelDrawer(); showToast('增量权益已更新，请保存等级规则'); }

    const saveLevel = event.target.closest('[data-save-level]');
    if (saveLevel) {
      const row = levels.find((item) => item.level === Number(saveLevel.dataset.saveLevel));
      row.targets = [...drawerBody.querySelectorAll('[data-level-target]')].map((input) => Number(input.value));
      row.relation = drawerBody.querySelector('#level-relation').value;
      row.commission = drawerBody.querySelector('#level-commission').value;
      row.benefitIds = state.levelBenefitDraft.slice();
      row.benefits = row.benefitIds.map((id) => benefits.find((item) => item.id === id)?.name).filter(Boolean).join('、') || '暂无增量权益';
      row.condition = `客户${row.targets[0]}｜团队${row.targets[1]}｜店铺收益¥${row.targets[2].toLocaleString()}`;
      state.pendingChanges += 1;
      closeDrawer(); render(); showToast(`LV${row.level}规则草稿已保存，发布后生效`);
    }

    if (event.target.closest('[data-new-benefit]')) openBenefitDrawer('create');
    const viewBenefit = event.target.closest('[data-view-benefit]');
    if (viewBenefit) openBenefitDrawer('view', viewBenefit.dataset.viewBenefit);
    const editBenefit = event.target.closest('[data-edit-benefit]');
    if (editBenefit) openBenefitDrawer('edit', editBenefit.dataset.editBenefit);
    const saveBenefit = event.target.closest('[data-save-benefit]');
    if (saveBenefit) {
      const input = {
        name: drawerBody.querySelector('#benefit-name').value,
        category: drawerBody.querySelector('#benefit-category').value,
        icon: drawerBody.querySelector('#benefit-icon').value,
        order: Number(drawerBody.querySelector('#benefit-order').value),
        shortDescription: drawerBody.querySelector('#benefit-short-description').value,
        detailDescription: drawerBody.querySelector('#benefit-detail-description').value,
        link: drawerBody.querySelector('#benefit-link').value,
        grantMode: drawerBody.querySelector('#benefit-grant-mode').value,
        validity: drawerBody.querySelector('#benefit-validity').value,
        businessRule: drawerBody.querySelector('#benefit-business-rule').value,
        description: drawerBody.querySelector('#benefit-short-description').value,
        source: drawerBody.querySelector('#benefit-source').value,
        status: drawerBody.querySelector('#benefit-status').value,
      };
      if (state.editingBenefit) {
        const original = benefits.find((item) => item.id === state.editingBenefit);
        const mutation = model.canMutateBenefit(original.id, onlineReferencedBenefitIds());
        if (original.status === '生效中' && input.status === '已暂停' && !mutation.allowed) { showToast(mutation.reason); return; }
      }
      const result = state.benefitMode === 'create' ? model.createBenefit(benefits, input) : model.updateBenefit(benefits, state.editingBenefit, input);
      if (!result.ok) { showToast(result.error); drawerBody.querySelector('#benefit-name').focus(); }
      else { benefits = model.sortBenefits(result.records); state.pendingChanges += 1; closeDrawer(); render(); showToast(state.benefitMode === 'create' ? '权益已创建，待随新版本发布' : '权益修改已保存，待发布'); }
    }
    const toggleBenefit = event.target.closest('[data-toggle-benefit]');
    if (toggleBenefit) {
      const item = benefits.find((benefit) => benefit.id === toggleBenefit.dataset.toggleBenefit);
      const mutation = model.canMutateBenefit(item.id, onlineReferencedBenefitIds());
      if (item.status === '生效中' && !mutation.allowed) showToast(mutation.reason);
      else {
        const result = model.updateBenefit(benefits, item.id, { status: item.status === '生效中' ? '已暂停' : '生效中' });
        benefits = result.records; state.pendingChanges += 1; render(); showToast(`${item.name}已${item.status === '生效中' ? '停用' : '恢复'}，待发布`);
      }
    }
    const sortBenefit = event.target.closest('[data-sort-benefit]');
    if (sortBenefit) {
      const item = benefits.find((benefit) => benefit.id === sortBenefit.dataset.sortBenefit);
      const group = model.sortBenefits(benefits).filter((benefit) => benefit.category === item.category);
      const index = group.findIndex((benefit) => benefit.id === item.id);
      const nextIndex = index + Number(sortBenefit.dataset.sortDirection);
      if (nextIndex < 0 || nextIndex >= group.length) showToast('已在当前类别的边界');
      else {
        const targetOrder = (Number(item.order) + Number(group[nextIndex].order)) / 2 + (nextIndex < index ? -0.1 : 0.1);
        benefits = model.reorderBenefit(benefits, item.id, targetOrder); state.pendingChanges += 1; render(); showToast(`${item.name}展示顺序已调整`);
      }
    }
    const deleteBenefit = event.target.closest('[data-delete-benefit]');
    if (deleteBenefit) {
      const item = benefits.find((benefit) => benefit.id === deleteBenefit.dataset.deleteBenefit);
      const mutation = model.canMutateBenefit(item.id, onlineReferencedBenefitIds());
      if (!mutation.allowed) showToast(mutation.reason);
      else openConfirm('删除权益', `确认删除“${item.name}”？删除后不可恢复。`, '确认删除', () => {
        const result = model.deleteBenefit(benefits, item.id, onlineReferencedBenefitIds());
        if (!result.ok) showToast(result.error);
        else { benefits = result.records; state.pendingChanges += 1; render(); showToast('权益已删除，待随新版本发布'); }
      });
    }

    const viewIssuance = event.target.closest('[data-view-issuance]');
    if (viewIssuance) openIssuanceDetail(viewIssuance.dataset.viewIssuance);
    const issuanceAction = event.target.closest('[data-issuance-action]');
    if (issuanceAction) openIssuanceAction(issuanceAction.dataset.issuanceId, issuanceAction.dataset.issuanceAction);
    if (event.target.closest('[data-confirm-issuance-action]')) {
      const result = model.changeIssuanceStatus(issuanceRows, state.editingIssuance, state.issuanceAction, drawerBody.querySelector('#issuance-reason').value);
      if (!result.ok) { showToast(result.error); drawerBody.querySelector('#issuance-reason').focus(); }
      else { const action = state.issuanceAction; issuanceRows = result.records; closeDrawer(); render(); showToast(`权益已${action}，操作原因已留存`); }
    }

    if (event.target.closest('[data-open-publish]')) openPublish();
    if (event.target.closest('[data-confirm-publish]')) {
      const preview = model.createPublishPreview({ currentVersion: state.version });
      state.version = preview.nextVersion;
      versionHistory = model.publishVersion(versionHistory, { version: state.version, operator: '陈运营', summary: '更新等级条件与权益配置', effectiveAt: '2026-08-05 15:30', createdAt: '2026-08-05 15:28' });
      state.pendingChanges = 0;
      publishModal.hidden = true; render(); showToast(`规则版本 ${state.version} 已发布并生成历史记录`);
    }
    const versionDetail = event.target.closest('[data-version-detail]');
    if (versionDetail) openVersionDetail(versionDetail.dataset.versionDetail, false);
    const versionCompare = event.target.closest('[data-version-compare]');
    if (versionCompare) openVersionDetail(versionCompare.dataset.versionCompare, true);

    const registrationDetail = event.target.closest('[data-registration-detail]');
    if (registrationDetail) openRegistrationDetail(registrationDetail.dataset.registrationDetail);
    const openOwner = event.target.closest('[data-open-owner]');
    if (openOwner) {
      const result = model.openStoreOwner(registrations, storeProfiles, openOwner.dataset.openOwner, '陈运营');
      if (!result.ok) showToast(result.error);
      else {
        registrations = result.registrations;
        storeProfiles = result.profiles;
        render();
        showToast(result.idempotent ? '该用户已开通，未重复创建店主资料' : '开通成功：已生成LV2店主、店铺资料与初始权益');
      }
    }
    const storeDetail = event.target.closest('[data-store-detail]');
    if (storeDetail) openStoreDetail(storeDetail.dataset.storeDetail);
    const renameStore = event.target.closest('[data-rename-store]');
    if (renameStore) openRenameStore(renameStore.dataset.renameStore);
    if (event.target.closest('[data-save-store-name]')) {
      const result = model.renameStore(storeProfiles, state.editingStoreId, drawerBody.querySelector('#store-new-name').value, '陈运营', drawerBody.querySelector('#store-rename-reason').value);
      if (!result.ok) showToast(result.error);
      else { storeProfiles = result.records; closeDrawer(); render(); showToast('店铺名称已更新，名称变更记录已保存'); }
    }
    if (event.target.closest('[data-new-content]')) openContentDrawer();
    const editContent = event.target.closest('[data-edit-content]');
    if (editContent) openContentDrawer(editContent.dataset.editContent);
    const toggleContent = event.target.closest('[data-toggle-content]');
    if (toggleContent) {
      contentRows = contentRows.map((row) => row.id === toggleContent.dataset.toggleContent ? { ...row, status: row.status === '已上架' ? '已下架' : '已上架', updatedAt: '2026-08-07 10:45' } : row);
      render(); showToast('上下架状态已更新，小程序内容同步刷新');
    }
    if (event.target.closest('[data-save-content]')) {
      const title = drawerBody.querySelector('#content-title').value.trim();
      if (!title) { showToast('请输入内容标题'); return; }
      const input = {
        title,
        category: drawerBody.querySelector('#content-category').value,
        format: drawerBody.querySelector('#content-format').value,
        order: Number(drawerBody.querySelector('#content-order').value),
        level: drawerBody.querySelector('#content-level').value,
        benefit: drawerBody.querySelector('#content-benefit').value,
        status: drawerBody.querySelector('#content-status').value,
        updatedAt: '2026-08-07 10:46',
      };
      if (state.editingContentId) contentRows = contentRows.map((row) => row.id === state.editingContentId ? { ...row, ...input } : row);
      else contentRows = [...contentRows, { id: `C${String(contentRows.length + 1).padStart(3, '0')}`, ...input }];
      closeDrawer(); render(); showToast('培训素材内容已保存');
    }

    const agentDetail = event.target.closest('[data-agent-detail]');
    if (agentDetail) openAgentDrawer(agentDetail.dataset.agentDetail);
    const agentDetailTab = event.target.closest('[data-agent-detail-tab]');
    if (agentDetailTab) { state.agentDetailTab = agentDetailTab.dataset.agentDetailTab; renderAgentDrawer(); }
    const agentAction = event.target.closest('[data-agent-action]');
    if (agentAction) openAgentAction(agentAction.dataset.agentAction);
    const appeal = event.target.closest('[data-appeal]');
    if (appeal) openAppealDrawer(Number(appeal.dataset.appeal));
    if (event.target.closest('[data-save-agent]')) { closeDrawer(); showToast('店主调整已记录，历史快照已生成'); }
    const saveAppeal = event.target.closest('[data-save-appeal]');
    if (saveAppeal) { appeals[Number(saveAppeal.dataset.saveAppeal)].progress = '处理中'; closeDrawer(); render(); showToast('申诉处理结果已保存'); }

    const stateRule = event.target.closest('[data-state-rule]');
    if (stateRule) openStateRuleDrawer(stateRule.dataset.stateRule);
    if (event.target.closest('[data-save-state-rule]')) { closeDrawer(); showToast('状态影响模板已保存'); }

    const logDetail = event.target.closest('[data-log-detail]');
    if (logDetail) openLogDetail(logDetail.dataset.logDetail);
    const retry = event.target.closest('[data-retry-log]');
    if (retry) { logs = model.retryCalculation(logs, retry.dataset.retryLog); render(); showToast('重算完成，原失败记录已保留'); }
    if (event.target.closest('[data-retry-all]')) { logs.filter((row) => row.status === '失败').forEach((row) => { logs = model.retryCalculation(logs, row.id); }); render(); showToast('全部失败记录已重新计算'); }
    const migration = event.target.closest('[data-migration]');
    if (migration && !migration.disabled) { state.migrationStep = Number(migration.dataset.migration); render(); showToast(['','试跑完成','正式迁移完成','校验完成'][state.migrationStep]); }

    if (event.target.closest('[data-close-drawer]')) closeDrawer();
    if (event.target.closest('[data-close-publish]')) publishModal.hidden = true;
    if (event.target.closest('[data-close-benefit-picker]')) benefitPickerModal.hidden = true;
    if (event.target.closest('[data-close-confirm]')) { confirmModal.hidden = true; state.confirmAction = null; }
    if (event.target.closest('#confirm-action') && state.confirmAction) { const action = state.confirmAction; confirmModal.hidden = true; state.confirmAction = null; action(); }
    if (event.target.closest('[data-close-info]')) infoModal.hidden = true;
    const toastButton = event.target.closest('[data-toast]');
    if (toastButton) showToast(toastButton.dataset.toast);
  });

  document.addEventListener('input', (event) => {
    if (event.target.matches('[data-table-search]')) { state.search = event.target.value.trim(); render(); const next = content.querySelector('[data-table-search]'); if (next) { next.focus(); next.setSelectionRange(state.search.length, state.search.length); } }
    if (event.target === benefitPickerSearch) renderBenefitPicker();
  });

  document.addEventListener('change', (event) => {
    if (event.target.matches('[data-benefit-option]')) { if (event.target.checked) state.benefitPickerSelected.add(event.target.value); else state.benefitPickerSelected.delete(event.target.value); benefitPickerCount.textContent = `已选择 ${state.benefitPickerSelected.size} 项`; }
  });

  document.addEventListener('dragstart', (event) => {
    const row = event.target.closest('[data-benefit-drag]');
    if (!row) return;
    state.dragBenefitId = row.dataset.benefitDrag;
    row.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', state.dragBenefitId);
  });

  document.addEventListener('dragover', (event) => {
    if (state.dragBenefitId && event.target.closest('[data-benefit-row]')) event.preventDefault();
  });

  document.addEventListener('drop', (event) => {
    const targetRow = event.target.closest('[data-benefit-row]');
    if (!targetRow || !state.dragBenefitId) return;
    event.preventDefault();
    const source = benefits.find((item) => item.id === state.dragBenefitId);
    const target = benefits.find((item) => item.id === targetRow.dataset.benefitRow);
    if (!source || !target || source.id === target.id) return;
    if (source.category !== target.category) { showToast('权益只能在同一类别内调整展示顺序'); return; }
    const targetOrder = Number(target.order) + (Number(source.order) < Number(target.order) ? 0.1 : -0.1);
    benefits = model.reorderBenefit(benefits, source.id, targetOrder);
    state.pendingChanges += 1;
    render();
    showToast(`${source.name}已移动至${target.name}附近`);
  });

  document.addEventListener('dragend', () => {
    state.dragBenefitId = null;
    content.querySelectorAll('.dragging').forEach((row) => row.classList.remove('dragging'));
  });

  autoUpgrade.addEventListener('change', () => { state.autoUpgrade = autoUpgrade.checked; render(); showToast(`自动升级已${state.autoUpgrade ? '开启' : '暂停'}`); });
  globalSearch.addEventListener('keydown', (event) => { if (event.key === 'Enter') { state.search = globalSearch.value.trim(); state.section = 'owners'; state.tab = 'owners'; render(); } });
  [publishModal, benefitPickerModal, confirmModal, infoModal].forEach((modal) => modal.addEventListener('click', (event) => { if (event.target === modal) modal.hidden = true; }));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeDrawer(); publishModal.hidden = true; benefitPickerModal.hidden = true; confirmModal.hidden = true; infoModal.hidden = true; } });

  render();
})();
