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
    search: '', menuOpen: true, editingLevel: null, levelMode: 'edit', levelDraftRow: null, levelBenefitDraft: [], levelTierSelectionDraft: {}, benefitPickerSelected: new Set(),
    editingBenefit: null, benefitMode: 'view', benefitEditorOpen: false, benefitTierDraft: [], benefitTemplateDraft: '', benefitTemplateWasCleared: false, benefitKindFilter: 'all', benefitTemplateFilter: 'all', confirmAction: null, dragBenefitId: null,
    editingIssuance: null, issuanceAction: null, pendingChanges: 3,
    agentDetailId: null, agentDetailTab: 'profile', editingStoreId: null, editingContentId: null,
  };

  const sectionTabs = {
    owners: [{ id: 'owners', name: '店主列表' }, { id: 'registrations', name: '开店登记', badge: 3 }],
    levels: [{ id: 'levels', name: '等级规则' }, { id: 'benefits', name: '权益库' }, { id: 'templates', name: '权益规则模板' }],
    content: [{ id: 'content', name: '培训素材内容管理' }],
    tasks: [{ id: 'logs', name: '计算日志', badge: 3 }, { id: 'migration', name: '存量迁移' }],
  };

  const levels = [
    { level: 1, identity: '普通用户', condition: '注册后默认等级', relation: '固定等级', commission: '无店铺收益', benefitIds: [], tierSelections: {}, benefits: '基础回收服务', enabled: true, targets: [0, 0, 0], upgradeMode: '不适用' },
    { level: 2, identity: '成长店主', condition: '店铺客户 ≥ 3', relation: '全部满足', commission: '方案1.0', benefitIds: ['B01', 'B02', 'B16', 'B05'], tierSelections: { B01: 'T1', B02: 'T1', B16: 'T1' }, benefits: '新人成交奖励、品类订单佣金、品类二级订单佣金、基础培训', enabled: true, targets: [3, 0, 0], upgradeMode: '自动升级' },
    { level: 3, identity: '轻享店主', condition: '店铺客户5｜店铺收益¥2,000｜团队店主6', relation: '全部满足', commission: '方案1.1', benefitIds: ['B06'], tierSelections: {}, benefits: '深度线上运营培训', enabled: true, targets: [5, 2000, 6], upgradeMode: '自动升级' },
    { level: 4, identity: '轻享店主', condition: '店铺客户12｜店铺收益¥5,000｜团队店主12', relation: '全部满足', commission: '方案1.2', benefitIds: [], tierSelections: {}, benefits: '本级无新增权益', enabled: true, targets: [12, 5000, 12], upgradeMode: '自动升级' },
    { level: 5, identity: '轻享店主', condition: '店铺客户20｜店铺收益¥10,000｜团队店主20', relation: '全部满足', commission: '方案1.2', benefitIds: ['B03', 'B08'], tierSelections: { B01: 'T2', B03: 'T1' }, benefits: '管理收益、线上招募方案', enabled: true, targets: [20, 10000, 20], upgradeMode: '自动升级' },
    { level: 6, identity: '星享店主', condition: '店铺客户30｜店铺收益¥18,000｜团队店主35', relation: '全部满足', commission: '方案1.5', benefitIds: ['B09'], tierSelections: {}, benefits: '店主自媒体 IP 打造', enabled: true, targets: [30, 18000, 35], upgradeMode: '自动升级' },
    { level: 7, identity: '星享店主', condition: '店铺客户40｜店铺收益¥28,000｜团队店主55', relation: '全部满足', commission: '方案1.8', benefitIds: ['B10'], tierSelections: {}, benefits: '线下宣传与合作方案', enabled: true, targets: [40, 28000, 55], upgradeMode: '自动升级' },
    { level: 8, identity: '星享店主', condition: '店铺客户50｜店铺收益¥40,000｜团队店主80', relation: '全部满足', commission: '方案2.0', benefitIds: ['B07', 'B11'], tierSelections: { B02: 'T2', B16: 'T2', B07: 'T1' }, benefits: '视频素材下载、进阶交流群', enabled: true, targets: [50, 40000, 80], upgradeMode: '自动升级' },
    { level: 9, identity: '超级店主', condition: '店铺客户65｜店铺收益¥65,000｜团队店主120', relation: '全部满足', commission: '方案2.1', benefitIds: ['B04'], tierSelections: { B04: 'T1' }, benefits: '团队佣金', enabled: true, targets: [65, 65000, 120], upgradeMode: '自动升级' },
    { level: 10, identity: '超级店主', condition: '店铺客户90｜店铺收益¥100,000｜团队店主180', relation: '全部满足', commission: '方案2.2', benefitIds: ['B15'], tierSelections: { B15: 'T1' }, benefits: '鉴定服务', enabled: true, targets: [90, 100000, 180], upgradeMode: '自动升级' },
    { level: 11, identity: '超级店主', condition: '店铺客户120｜店铺收益¥160,000｜团队店主260', relation: '全部满足', commission: '方案2.3', benefitIds: ['B12', 'B13'], tierSelections: { B07: 'T2' }, benefits: '核心交流群、专属客服', enabled: true, targets: [120, 160000, 260], upgradeMode: '自动升级' },
    { level: 12, identity: '超级合伙人', condition: '满足资格后线下联系', relation: '线下审核', commission: '专属方案', benefitIds: ['B14'], tierSelections: { B15: 'T2' }, benefits: '最高等级店主证书', enabled: true, targets: [0, 0, 0], upgradeMode: '线下联系' },
  ];

  let benefits = [
    { id: 'B01', name: '新人成交奖励', category: '收益类', icon: '新', order: 10, kind: 'parameterized', templateId: 'newcomer-reward', tiers: [{ id: 'T1', name: '档位 1', values: { amount: 10 } }, { id: 'T2', name: '档位 2', values: { amount: 20 } }], history: [{ action: '创建权益', operator: '陈运营', time: '2026-08-12 09:20', effective: '实时生效' }], shortDescription: '平台新用户首笔有效回收订单奖励', detailDescription: '首次成功完成回收交易后发放，取消或退款不撤销。', description: '首笔有效回收订单奖励', status: '生效中' },
    { id: 'B02', name: '品类订单佣金', category: '收益类', icon: '佣', order: 20, kind: 'parameterized', templateId: 'category-commission', tiers: [{ id: 'T1', name: '档位 1', values: { items: [{ categories: ['正品鞋', '正品服', '废旧手机'], rate: 15, capType: 'capped', capAmount: 75 }, { categories: ['普鞋'], rate: 15, capType: 'unlimited' }, { categories: ['旧衣'], rate: 50, capType: 'unlimited' }] } }, { id: 'T2', name: '档位 2', values: { items: [{ categories: ['正品鞋', '正品服', '废旧手机', '旧书'], rate: 20, capType: 'capped', capAmount: 100 }] } }], history: [], shortDescription: '按品类设置直属店主订单佣金', detailDescription: '计佣基数固定为最终回收成交价，可独立设置单笔封顶。', description: '按业务品类配置直属订单佣金', status: '生效中' },
    { id: 'B16', name: '品类二级订单佣金', category: '收益类', icon: '二', order: 25, kind: 'parameterized', templateId: 'category-secondary-commission', tiers: [{ id: 'T1', name: '档位 1', values: { items: [{ categories: ['正品鞋', '正品服', '废旧手机'], rate: 5, capType: 'capped', capAmount: 25 }, { categories: ['普鞋'], rate: 5, capType: 'unlimited' }, { categories: ['旧衣'], rate: 10, capType: 'unlimited' }] } }, { id: 'T2', name: '档位 2', values: { items: [{ categories: ['正品鞋', '正品服', '废旧手机', '旧书'], rate: 5, capType: 'capped', capAmount: 25 }] } }], history: [], shortDescription: '按品类设置上级店主二级订单佣金', detailDescription: '计佣基数固定为最终回收成交价，可独立设置单笔封顶。', description: '按业务品类配置二级订单佣金', status: '生效中' },
    { id: 'B03', name: '开通店主与管理收益', category: '收益类', icon: '管', order: 30, kind: 'parameterized', templateId: 'management-income', tiers: [{ id: 'T1', name: '档位 1', values: { rate: 5, capType: 'capped', capAmount: 50 } }], history: [], shortDescription: '直接开通一级下属店主的订单管理收益', detailDescription: '按直属一级下属店主订单最终回收成交价计算。', description: '一级下属店主管理收益', status: '生效中' },
    { id: 'B04', name: '团队佣金', category: '收益类', icon: '团', order: 40, kind: 'parameterized', templateId: 'team-commission', tiers: [{ id: 'T1', name: '档位 1', values: { rate: 3, capType: 'capped', capAmount: 50 } }], history: [], shortDescription: '系统固定团队范围内的回收订单佣金', detailDescription: '运营只配置比例和上限，范围由系统固定。', description: '团队回收订单佣金', status: '生效中' },
    { id: 'B05', name: '线上回收基础培训', category: '运营类', icon: '基', order: 10, kind: 'fixed', tiers: [], history: [], shortDescription: '回收基础知识与开店入门培训', detailDescription: '覆盖基础收单、客户沟通与平台操作。', description: '基础回收培训', status: '生效中' },
    { id: 'B06', name: '深度线上运营培训', category: '运营类', icon: '深', order: 20, kind: 'fixed', tiers: [], history: [], shortDescription: '获客、转化与团队经营课程', detailDescription: '完整的获客、转化和团队经营线上课程。', description: '深度运营培训', status: '生效中' },
    { id: 'B07', name: '视频素材下载', category: '运营类', icon: '视', order: 30, kind: 'parameterized', templateId: 'daily-video', tiers: [{ id: 'T1', name: '档位 1', values: { dailyQuota: 1 } }, { id: 'T2', name: '档位 2', values: { dailyQuota: 2 } }], history: [], shortDescription: '按自然日下载可直接发布的视频素材', detailDescription: '每天可下载1或2条，24:00清零不结转。', description: '每日视频下载额度', status: '生效中' },
    { id: 'B08', name: '线上招募店主方案', category: '运营类', icon: '招', order: 40, kind: 'fixed', tiers: [], history: [], shortDescription: '线上招募店主的方法与物料', detailDescription: '提供招募流程、沟通话术和常用物料。', description: '线上招募方案', status: '生效中' },
    { id: 'B09', name: '店主自媒体 IP 打造', category: '运营类', icon: 'IP', order: 50, kind: 'fixed', tiers: [], history: [], shortDescription: '店主个人内容定位与账号打造', detailDescription: '提供账号定位、选题与内容表达方法。', description: '自媒体 IP 打造', status: '生效中' },
    { id: 'B10', name: '线下宣传与合作方案', category: '运营类', icon: '线', order: 60, kind: 'fixed', tiers: [], history: [], shortDescription: '线下推广与异业合作执行方案', detailDescription: '包含社区宣传、门店合作和活动执行参考。', description: '线下合作方案', status: '生效中' },
    { id: 'B11', name: '公司进阶店主交流群', category: '运营类', icon: '进', order: 70, kind: 'fixed', tiers: [], history: [], shortDescription: '进阶店主运营交流社群', detailDescription: '提供阶段性经营交流和官方运营信息。', description: '进阶店主交流群', status: '生效中' },
    { id: 'B12', name: '公司核心店主交流群', category: '运营类', icon: '核', order: 80, kind: 'fixed', tiers: [], history: [], shortDescription: '核心店主专属经营交流社群', detailDescription: '面向核心店主的深度交流和专项信息。', description: '核心店主交流群', status: '生效中' },
    { id: 'B13', name: '店主专属客服', category: '运营类', icon: '服', order: 90, kind: 'fixed', tiers: [], history: [], shortDescription: '专属客服与经营问题支持', detailDescription: '通过专属客服通道获得业务支持。', description: '店主专属客服', status: '生效中' },
    { id: 'B14', name: '最高等级店主证书', category: '证书类', icon: '证', order: 10, kind: 'fixed', tiers: [], history: [], shortDescription: '最高等级店主身份荣誉证书', detailDescription: '达到最高等级后获得专属身份荣誉证书。', description: '最高等级荣誉证书', status: '生效中' },
    { id: 'B15', name: '鉴定服务', category: '鉴定类', icon: '鉴', order: 10, kind: 'parameterized', templateId: 'monthly-appraisal', tiers: [{ id: 'T1', name: '档位 1', values: { monthlyQuota: 5 } }, { id: 'T2', name: '档位 2', values: { monthlyQuota: 10 } }], history: [], shortDescription: '按自然月提供专属鉴定服务次数', detailDescription: '月末清零不结转，等级变化次日生效。', description: '每月鉴定服务次数', status: '生效中' },
  ];

  const benefitAuditLogs = [];

  let issuanceRows = [
    { id: 'I0805001', agent: '陈先生 · A10248', benefitId: 'B01', benefit: '鞋服业务收益', sourceLevel: 'LV2', grantAt: '2026-05-18 09:30', effective: '长期有效', version: '1.0', status: '生效中', history: [] },
    { id: 'I0805002', agent: '陈先生 · A10248', benefitId: 'B03', benefit: '深度线上运营培训', sourceLevel: 'LV3', grantAt: '2026-06-02 11:16', effective: '等级期间有效', version: '1.0', status: '生效中', history: [] },
    { id: 'I0805003', agent: '吴女士 · A10250', benefitId: 'B01', benefit: '鞋服业务收益', sourceLevel: 'LV2', grantAt: '2026-04-09 15:22', effective: '休眠期间暂停', version: '0.9', status: '已暂停', history: [{ action: '暂停', reason: '店主进入休眠状态', time: '2026-08-01 00:00' }] },
    { id: 'I0805004', agent: '林先生 · A10251', benefitId: 'B04', benefit: '每月30条成片素材', sourceLevel: 'LV8', grantAt: '2026-07-20 10:08', effective: '2026-07-20 至 2026-08-19', version: '1.0', status: '已失效', history: [] },
  ];

  let versionHistory = [
    { version: '0.9', status: '已失效', effectiveAt: '2026-07-18 09:00', createdAt: '2026-07-17 18:36', operator: '王运营', summary: '调整LV3素材权益与团队店主门槛' },
    { version: '1.0', status: '生效中', effectiveAt: '2026-08-05 09:00', createdAt: '2026-08-04 20:16', operator: '陈运营', summary: '新增LV5手机品类与专属素材' },
  ];

  const agents = [
    { id: 'A10248', name: '陈先生', storeName: '陈先生回收店', phone: '138****6842', level: 'LV4', identity: '轻享店主', status: '正常', progress: '72%', customers: 18, teamOwners: 8, orders: 26, commission: '¥18,620', openedAt: '2026-05-18' },
    { id: 'A10249', name: '周先生', storeName: '星光回收店', phone: '137****2910', level: 'LV3', identity: '轻享店主', status: '预警', progress: '84%', customers: 9, teamOwners: 4, orders: 12, commission: '¥6,420', openedAt: '2026-06-02' },
    { id: 'A10250', name: '吴女士', storeName: '吴女士回收店', phone: '186****5108', level: 'LV2', identity: '成长店主', status: '休眠', progress: '31%', customers: 3, teamOwners: 0, orders: 0, commission: '¥820', openedAt: '2026-04-09' },
    { id: 'A10251', name: '林先生', storeName: '邻里循环回收店', phone: '159****7714', level: 'LV8', identity: '星享店主', status: '限权', progress: '66%', customers: 62, teamOwners: 26, orders: 148, commission: '¥72,680', openedAt: '2026-03-12' },
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
    { id: 'LOG-0805-001', agent: 'A10248 · 陈先生', source: '经营指标更新', version: '1.0', result: 'LV4 → LV4', status: '成功', time: '10:24:16', duration: '176毫秒', snapshot: '店铺客户 16人｜店铺收益 8,620元｜团队店主 8人', failStep: '无', attempt: 1 },
    { id: 'LOG-0805-002', agent: 'A10249 · 周先生', source: '周期校准', version: '1.0', result: '指标读取超时', status: '失败', time: '10:23:42', duration: '3,002毫秒', snapshot: '店铺客户 9人｜店铺收益 6,420元｜团队店主读取超时', failStep: '第3步：读取直属团队店主数量', attempt: 1 },
    { id: 'LOG-0805-003', agent: 'A10250 · 吴女士', source: '店主状态变化', version: '1.0', result: '进入休眠', status: '成功', time: '10:22:08', duration: '126毫秒', snapshot: '店铺客户 3人｜店铺收益 820元｜团队店主 0人', failStep: '无', attempt: 1 },
  ];

  const appeals = [
    { agent: '吴女士 · A10250', status: '休眠', reason: '已补充线下订单凭证，请求恢复经营状态', progress: '待受理', owner: '未分配' },
    { agent: '林先生 · A10251', status: '限权', reason: '申请复核团队收益限制', progress: '处理中', owner: '王运营' },
    { agent: '匿名店主 · A10188', status: '冻结', reason: '已提交身份及交易证明材料', progress: '待复核', owner: '李风控' },
  ];

  const moduleMeta = {
    dashboard: ['经营分析', '店主经营总览', '观察有效经营、升级趋势和等级分布。'],
    owners: ['店主管理', '店主与开店', '统一管理店主、开店登记和店铺资料。'],
    registrations: ['店主管理', '店主与开店', '查看登记资料并执行幂等的手动开通。'],
    stores: ['店主管理', '店主与开店', '维护一对一店铺资料和名称变更记录。'],
    levels: ['规则中心', '等级与权益', '配置升级规则和权益库。'],
    versions: ['规则中心', '等级与权益', '查看历史版本和变更记录。'],
    benefits: ['规则中心', '等级与权益', '配置升级规则和权益库。'],
    templates: ['规则中心', '等级与权益', '查看系统预置的规则模板、参数定义和固定口径。'],
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
    return `<section class="stat-grid dashboard-stats"><article class="stat-card"><div class="stat-card-head"><span>店主总数</span><i>店</i></div><strong>12,680</strong><small>较上月 +4.8%</small></article><article class="stat-card effective-operation-card"><div class="stat-card-head"><div class="stat-title-with-help"><span>近90天有效经营率</span><details class="effective-operation-definition"><summary aria-label="查看有效经营说明">!</summary><div><b>有效经营店主</b><p>近90天内，本人或现有分佣团队至少产生1笔有效订单的正常店主。</p><em>有效经营率 = 有效经营店主数 ÷ 正常店主总数</em></div></details></div><i>营</i></div><strong>78.6%</strong><small>较上周 +1.2%</small></article><article class="stat-card"><div class="stat-card-head"><span>本月升级人数</span><i>级</i></div><strong>642</strong><small>其中自动升级 618 人</small></article><article class="stat-card"><div class="stat-card-head"><span>即将升级店主</span><i>即</i></div><strong>1,426</strong><small>下一级完成度 ≥ 80%</small></article></section>`;
  }

  function renderDashboard() {
    return `${pageHead('<button class="primary-button" data-section="levels">管理等级与权益</button>')}${dashboardStats()}<section class="panel-grid dashboard-main"><article class="panel dashboard-level-panel"><div class="panel-head"><h2>等级分布</h2><span class="live-update"><i></i>实时更新 · <b data-level-live-time>--:--:--</b></span></div>${[['LV1 普通用户',88,6340],['LV2—LV5',72,3660],['LV6—LV8',43,1810],['LV9—LV11',18,758],['LV12 超级合伙人',4,112]].map((row) => `<div class="bar-row"><span>${row[0]}</span><div class="bar-track"><i style="width:${row[1]}%"></i></div><b>${row[2]}</b></div>`).join('')}</article></section><section class="panel-grid dashboard-secondary"><article class="panel"><div class="panel-head"><h2>本月升级流向</h2><span>共642人</span></div><div class="flow-list">${[['LV1 → LV2',168,72],['LV2 → LV3',146,63],['LV4 → LV5',112,49],['LV7 → LV8',84,36],['LV10 → LV11',32,14]].map((row) => `<div><span>${row[0]}</span><i><b style="width:${row[2]}%"></b></i><strong>${row[1]}人</strong></div>`).join('')}</div></article><article class="panel"><div class="panel-head"><h2>即将升级店主分布</h2><span>下一级完成度 ≥ 80%</span></div><div class="near-levels"><article><strong>426</strong><span>待升 LV2</span></article><article><strong>318</strong><span>待升 LV5</span></article><article><strong>246</strong><span>待升 LV8</span></article><article><strong>86</strong><span>已达标</span></article></div><button class="text-button" data-section="owners">查看即将升级店主明细 →</button></article></section>`;
  }

  function renderLevels() {
    const rows = levels.filter((row) => !state.search || `${row.level}${row.identity}${row.condition}`.includes(state.search));
    return `${pageHead()}<div class="filter-bar"><input type="search" data-table-search placeholder="搜索等级或身份" value="${state.search}"><span class="filter-meta">共 ${levels.length} 个等级</span><button type="button" class="primary-button" data-new-level>新增等级</button></div><section class="data-table"><div class="table-row head level-table"><span>等级</span><span>身份</span><span>升级条件</span><span>升级方式</span><span>开关</span><span>操作</span></div>${rows.map((row) => `<div class="table-row level-table"><strong>LV${row.level}</strong><span>${row.identity}</span><span class="condition-summary">${row.condition}<small>${row.relation}</small></span><span>${row.upgradeMode}</span>${pill(row.enabled ? '已开启' : '已暂停')}${row.level === 1 ? '<button type="button" data-toast="LV1为固定等级，不可编辑">查看</button>' : `<button type="button" data-edit-level="${row.level}">编辑</button>`}</div>`).join('')}</section>`;
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
    return { '收益类': 'revenue', '运营类': 'operation', '证书类': 'certificate', '鉴定类': 'appraisal' }[category] || '';
  }

  function templateParameterRange(parameter) {
    if (parameter.options) return parameter.options.join('、');
    const lower = parameter.minExclusive !== undefined ? `大于${parameter.minExclusive}` : parameter.min !== undefined ? `不小于${parameter.min}` : '';
    const upper = parameter.max !== undefined ? `，不超过${parameter.max}` : '';
    const precision = parameter.decimals !== undefined ? `，最多${parameter.decimals}位小数` : parameter.type === 'integer' ? '，仅正整数' : '';
    return `${lower}${upper}${precision}${parameter.unit ? `（${parameter.unit}）` : ''}` || '按字段定义填写';
  }

  function renderRuleTemplates() {
    const templates = model.getRuleTemplates();
    const audit = benefitAuditLogs.length ? `<section class="panel benefit-audit-panel"><div class="panel-head"><h2>权益变更审计</h2><span>删除权益后仍永久保留</span></div><ul class="timeline">${[...benefitAuditLogs].reverse().map((entry) => `<li><strong>${entry.action} · ${entry.time}</strong><span>${entry.operator} · ${entry.benefitName}</span><small>${JSON.stringify(entry.before)}</small></li>`).join('')}</ul></section>` : '';
    return `${pageHead()}<div class="scope-note"><b>系统只读模板</b><span>本页仅说明有哪些模板、参数定义和固定规则；实际业务值请在权益库中配置。新增模板需由产品和研发扩展。</span></div><section class="template-grid">${templates.map((template) => {
      const usedBenefits = benefits.filter((benefit) => benefit.templateId === template.id);
      return `<article class="template-card"><header><div><span>${template.category}</span><h2>${template.name}</h2></div><b>${usedBenefits.length} 项权益使用</b></header><p>${template.description}</p>${template.fixedBase ? `<div class="template-base"><span>固定计费基数</span><strong>${template.fixedBase}</strong></div>` : ''}<section><h3>参数定义</h3><div class="template-parameters">${template.parameters.map((parameter) => `<div><strong>${parameter.label}</strong><span>${templateParameterRange(parameter)}</span></div>`).join('')}</div></section><section><h3>固定规则</h3><ul>${template.fixedRules.map((rule) => `<li>${rule}</li>`).join('')}</ul></section><footer><span>使用权益</span><strong>${usedBenefits.map((benefit) => benefit.name).join('、') || '暂无'}</strong></footer></article>`;
    }).join('')}</section>${audit}`;
  }

  function renderBenefits() {
    const benefitKindFilter = state.benefitKindFilter;
    const benefitTemplateFilter = state.benefitTemplateFilter;
    const rows = model.sortBenefits(benefits).filter((row) => (
      (!state.search || `${row.name}${row.category}${row.shortDescription}`.includes(state.search))
      && (benefitKindFilter === 'all' || row.kind === benefitKindFilter)
      && (benefitTemplateFilter === 'all' || row.templateId === benefitTemplateFilter)
    ));
    const templateNames = new Map(model.getRuleTemplates().map((template) => [template.id, template.name]));
    const categories = ['收益类', '运营类', '证书类', '鉴定类'];
    const groupedRows = categories.map((category) => {
      const categoryRows = rows.filter((row) => row.category === category);
      if (!categoryRows.length) return '';
      return `<div class="benefit-category-row ${benefitCategoryTone(category)}"><span>${category}</span><small>${categoryRows.length} 项 · 类别顺序固定，仅可调整组内展示顺序</small></div>${categoryRows.map((row) => {
        const references = benefitReferences(row.id);
        const referenced = references.length > 0;
        const templateName = templateNames.get(row.templateId);
        const ruleSummary = row.kind === 'parameterized'
          ? templateName && row.tiers.length ? `<strong>参数化权益 · ${templateName}</strong><small>${row.tiers.length} 个参数档位 · ${row.tiers.map((tier) => tier.name).join(' / ')}</small>` : '<strong class="warning-text">参数化权益</strong><small>未配置，不可分配</small>'
          : '<strong>固定权益</strong><small>无需规则</small>';
        return `<div class="table-row benefit-table" draggable="true" data-benefit-row="${row.id}" data-benefit-drag="${row.id}" data-benefit-category="${row.category}"><button type="button" class="drag-handle" aria-label="拖拽调整${row.name}排序" title="仅可在${row.category}内拖拽排序">⋮⋮</button><span class="benefit-name"><i>${row.icon || '权'}</i><span><strong>${row.name}</strong><small>${row.id} · ${row.shortDescription || row.description}</small></span></span><span><strong>${row.order}</strong><small>展示排序</small></span><span class="rule-config-summary">${ruleSummary}</span><span class="reference-summary">${referenced ? `<strong>${references.slice(0, 4).join('、')}${references.length > 4 ? '等' : ''}</strong><small>当前等级引用</small>` : '<strong>未引用</strong><small>可停用或删除</small>'}</span>${pill(row.status)}<div class="row-actions"><button data-view-benefit="${row.id}">查看</button><button data-edit-benefit="${row.id}">编辑</button><button data-toggle-benefit="${row.id}" ${referenced && row.status === '生效中' ? 'class="locked-action" title="当前等级引用中"' : ''}>${row.status === '生效中' ? '停用' : '恢复'}</button><button class="danger-link ${referenced ? 'locked-action' : ''}" data-delete-benefit="${row.id}" ${referenced ? 'title="当前等级引用中"' : ''}>删除</button></div></div>`;
      }).join('')}`;
    }).join('');
    return `${pageHead('<button class="primary-button" data-new-benefit>新建权益</button>')}<div class="filter-bar"><input type="search" data-table-search placeholder="搜索权益名称或类别" value="${state.search}"><select data-benefit-kind-filter><option value="all">全部权益形态</option><option value="fixed" ${benefitKindFilter === 'fixed' ? 'selected' : ''}>固定权益</option><option value="parameterized" ${benefitKindFilter === 'parameterized' ? 'selected' : ''}>参数化权益</option></select><select data-benefit-template-filter><option value="all">全部规则模板</option>${model.getRuleTemplates().map((template) => `<option value="${template.id}" ${benefitTemplateFilter === template.id ? 'selected' : ''}>${template.name}</option>`).join('')}</select><span class="filter-meta">共 ${rows.length} 项权益</span></div><section class="data-table benefit-library"><div class="table-row head benefit-table"><span></span><span>权益名称</span><span>展示排序</span><span>规则配置</span><span>当前引用</span><span>状态</span><span>操作</span></div>${groupedRows}</section><p class="sort-note">排序说明：拖拽仅会改变同一类别中的展示顺序；被等级引用的权益不可停用或删除。</p>`;
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
    return `${pageHead()}<div class="filter-bar"><input type="search" data-table-search placeholder="搜索店主、店铺、编号或手机号" value="${state.search}"><select><option>全部等级</option><option>LV2—LV5</option><option>LV6—LV8</option><option>LV9—LV12</option></select><select><option>全部状态</option><option>正常</option><option>预警</option><option>休眠</option></select><span class="filter-meta">共12,680名店主</span></div><section class="data-table"><div class="table-row head owner-table"><span>店主 / 店铺</span><span>等级</span><span>客户 / 团队订单</span><span>已结算店铺收益</span><span>开通时间</span><span>操作</span></div>${rows.map((row) => `<div class="table-row owner-table"><span><strong>${row.name}</strong><small>${row.storeName} · ${row.id} · ${row.phone}</small></span><span><strong>${row.level}</strong><small>${row.identity}</small></span><span>${row.customers}人 / ${row.orders}笔<small>进度 ${row.progress}</small></span><strong>${row.commission}</strong><span>${row.openedAt}</span><button data-agent-detail="${row.id}">详情</button></div>`).join('')}</section>`;
  }

  function renderRegistrations() {
    const rows = registrations.filter((row) => !state.search || `${row.realName}${row.phone}${row.wechat}${row.city}${row.storeName}`.includes(state.search));
    const pending = registrations.filter((row) => !row.opened).length;
    return `${pageHead()}<section class="registration-summary"><article><span>待开通</span><strong>${pending}</strong><small>资料异常线下沟通</small></article><article><span>今日登记</span><strong>18</strong><small>重复登记更新原记录</small></article><article><span>今日开通</span><strong>11</strong><small>单次事务生成LV2与资料</small></article></section><div class="scope-note"><b>当前为人工开通，不建设审批流</b><span>点击“开通店主”后创建LV2成长店主、店铺资料和初始权益；重复操作保持幂等。</span></div><div class="filter-bar"><input type="search" data-table-search placeholder="搜索用户、手机号、微信号、城市或店名" value="${state.search}"><select><option>全部开通状态</option><option>待开通</option><option>已开通</option></select><span class="filter-meta">共 ${rows.length} 条示例登记</span></div><section class="data-table"><div class="table-row head registration-table"><span>用户 / 联系方式</span><span>城市 / 申请店名</span><span>提交时间 / 渠道</span><span>开通状态</span><span>操作人 / 时间</span><span>操作</span></div>${rows.map((row) => `<div class="table-row registration-table"><span><strong>${row.realName}（${row.nickname}）</strong><small>${row.phone} · 微信号 ${row.wechat}</small></span><span>${row.city}<small>${row.storeName || '未填写，将使用默认名称'}</small></span><span>${row.submittedAt}<small>${row.channel}</small></span>${pill(row.opened ? '已开通' : '待开通')}<span>${row.operator || '—'}<small>${row.operatedAt || '—'}</small></span><div class="row-actions"><button data-registration-detail="${row.id}">查看</button>${row.opened ? '<span>已完成</span>' : `<button class="primary-link" data-open-owner="${row.id}">开通店主</button>`}</div></div>`).join('')}</section>`;
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

  function refreshDashboardLiveTime() {
    const target = content.querySelector('[data-level-live-time]');
    if (!target) return;
    target.textContent = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  }

  function render() {
    renderNavigation();
    const views = { dashboard: renderDashboard, owners: renderAgents, registrations: renderRegistrations, stores: renderStores, levels: renderLevels, versions: renderVersions, benefits: renderBenefits, templates: renderRuleTemplates, issuance: renderIssuance, statuses: renderStatuses, content: renderContentManagement, logs: renderLogs, migration: renderMigration };
    content.innerHTML = state.benefitEditorOpen ? renderBenefitEditorPage() : (views[state.tab] || renderLevels)();
    autoUpgrade.checked = state.autoUpgrade;
    refreshDashboardLiveTime();
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
    state.levelDraftRow = null;
    state.levelMode = 'edit';
    state.levelTierSelectionDraft = {};
    state.editingBenefit = null;
    state.benefitTierDraft = [];
    state.benefitTemplateDraft = '';
    state.benefitTemplateWasCleared = false;
    state.editingIssuance = null;
    state.issuanceAction = null;
  }

  function renderLevelDrawer() {
    const row = state.levelDraftRow || levels.find((item) => item.level === state.editingLevel);
    const names = ['店铺客户', '店铺收益', '团队店主'];
    const units = ['人', '元', '人'];
    const upgradeMode = row.upgradeMode || '自动升级';
    const inheritedIds = model.resolveLevelBenefitIds(levels, state.editingLevel - 1);
    const allIds = [...new Set([...inheritedIds, ...state.levelBenefitDraft])];
    const benefitRows = allIds.map((id) => {
      const item = benefits.find((benefit) => benefit.id === id);
      if (!item) return '';
      const isCurrent = state.levelBenefitDraft.includes(id);
      const tierControl = item.kind === 'parameterized'
        ? `<select class="level-benefit-tier-select" data-level-tier-selection="${id}" aria-label="${item.name}档位">${item.tiers.map((tier) => `<option value="${tier.id}" ${state.levelTierSelectionDraft[id] === tier.id ? 'selected' : ''}>${tier.name}｜${model.summarizeBenefitTier(item, tier)}</option>`).join('')}</select>`
        : '<span class="fixed-tier-copy">无需档位</span>';
      return `<article class="level-benefit-row"><div class="level-benefit-name"><strong>${item.name}</strong><small>${isCurrent ? '本级新增' : '继承权益'}</small></div>${tierControl}${isCurrent ? `<button type="button" class="level-benefit-remove" data-remove-level-benefit="${id}" aria-label="移除${item.name}"><span aria-hidden="true">×</span><span>移除</span></button>` : '<span></span>'}</article>`;
    }).join('');
    drawerBody.innerHTML = `<section class="form-section"><div class="form-section-title"><strong>升级条件</strong><span>固定三类经营结果</span></div>${state.levelMode === 'create' ? `<div class="field"><label>等级身份</label><input data-level-identity value="${row.identity || ''}" placeholder="请输入等级身份"></div>` : ''}${names.map((name, index) => `<div class="field"><label>${name}</label><div class="field-row"><button class="condition-switch active" type="button" data-condition-toggle="${index}" aria-pressed="true"><i></i><span>已启用</span></button><label class="input-with-unit"><input type="number" min="0" value="${row.targets[index]}" data-level-target="${index}" aria-label="${name}门槛"><span>${units[index]}</span></label></div></div>`).join('')}<div class="field"><label>条件关系</label><select id="level-relation"><option ${row.relation === '全部满足' ? 'selected' : ''}>全部满足</option><option ${row.relation === '任一满足' ? 'selected' : ''}>任一满足</option></select></div><div class="field"><label>升级方式</label><select id="level-upgrade-mode"><option ${upgradeMode === '自动升级' ? 'selected' : ''}>自动升级</option><option ${upgradeMode === '线下联系' ? 'selected' : ''}>线下联系</option></select></div></section><section class="form-section"><div class="form-section-title"><strong>等级权益</strong><span>继承权益可在本级覆盖档位 · LV${state.editingLevel}</span></div><div class="level-benefit-list">${benefitRows}</div><button type="button" class="add-benefit-button" data-add-level-benefit>＋ 添加本级权益</button></section>`;
  }

  function openLevelDrawer(level, mode = 'edit') {
    const row = mode === 'create' ? {
      level, identity: '', condition: '', relation: '全部满足', commission: '未配置', benefitIds: [], tierSelections: {}, benefits: '本级无新增权益', enabled: true, targets: [0, 0, 0], upgradeMode: '自动升级',
    } : levels.find((item) => item.level === level);
    state.editingLevel = level;
    state.levelMode = mode;
    state.levelDraftRow = mode === 'create' ? row : null;
    state.levelBenefitDraft = row.benefitIds.slice();
    state.levelTierSelectionDraft = model.resolveLevelTierSelections(levels, benefits, level);
    openDrawer(`${mode === 'create' ? '新增' : '编辑'} LV${level} 规则`, '等级规则配置', '', `<button class="button" data-close-drawer>取消</button><button class="primary-button" data-save-level="${level}">${mode === 'create' ? '创建等级' : '保存修改'}</button>`);
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
    const inheritedIds = model.resolveLevelBenefitIds(levels, state.editingLevel - 1);
    const rows = benefits.filter((item) => !keyword || `${item.name}${item.category}`.includes(keyword));
    benefitPickerList.innerHTML = rows.map((item) => {
      const assignment = model.canAssignBenefit(item, state.editingLevel);
      const inherited = inheritedIds.includes(item.id);
      const disabledReason = inherited ? '已由低等级继承，无需重复添加' : item.status === '已暂停' ? '权益已暂停' : !assignment.allowed ? assignment.reason : '';
      const assignmentCopy = item.kind === 'parameterized' ? '参数权益 · 请选择档位' : '固定权益 · 无需档位';
      return `<label class="benefit-option ${disabledReason ? 'disabled' : ''}"><input type="checkbox" value="${item.id}" data-benefit-option ${state.benefitPickerSelected.has(item.id) ? 'checked' : ''} ${disabledReason ? 'disabled' : ''}><span><strong>${item.name}</strong><small>${item.category} · ${disabledReason || assignmentCopy}</small></span>${pill(disabledReason ? '不可添加' : item.status)}</label>`;
    }).join('');
    benefitPickerCount.textContent = `已选择 ${state.benefitPickerSelected.size} 项`;
  }

  function capFields(values, prefix, readOnly, tierIndex) {
    const typeKey = prefix ? `${prefix}CapType` : 'capType';
    const amountKey = prefix ? `${prefix}CapAmount` : 'capAmount';
    const label = prefix === 'direct' ? '直属单笔上限' : prefix === 'upstream' ? '上级单笔上限' : '单笔上限';
    return `<div class="field-row equal"><div class="field"><label>${label}</label><select data-tier-field="${typeKey}" data-tier-index="${tierIndex}" ${readOnly ? 'disabled' : ''}><option value="capped" ${values[typeKey] === 'capped' ? 'selected' : ''}>封顶</option><option value="unlimited" ${values[typeKey] === 'unlimited' ? 'selected' : ''}>上不封顶</option></select></div><div class="field"><label>封顶金额（元）</label><input type="number" min="0.01" step="0.01" data-tier-field="${amountKey}" data-tier-index="${tierIndex}" value="${values[amountKey] || ''}" ${values[typeKey] === 'unlimited' ? 'disabled' : ''} ${readOnly ? 'disabled' : ''}></div></div>`;
  }

  function renderCommissionItems(values, readOnly, tierIndex, templateId) {
    const categories = model.getBusinessCategories();
    const items = values.items || [];
    const commissionLabel = templateId === 'category-commission' ? '直属店主佣金' : '上级店主佣金';
    const maxRate = templateId === 'category-commission' ? 100 : 50;
    return `<div class="commission-items">${items.map((item, itemIndex) => `<article class="commission-item" data-commission-item data-tier-index="${tierIndex}" data-item-index="${itemIndex}">${readOnly ? '' : `<header><strong>品类计算项 ${itemIndex + 1}</strong><button type="button" class="danger-link" data-remove-commission-item="${tierIndex}:${itemIndex}">删除本项</button></header>`}<div class="field"><label>业务品类</label><div class="category-checks">${categories.map((category) => `<label><input type="checkbox" data-commission-category value="${category}" ${item.categories.includes(category) ? 'checked' : ''} ${readOnly ? 'disabled' : ''}>${category}</label>`).join('')}</div></div><div class="field"><label>${commissionLabel}（%）</label><input type="number" min="0.01" max="${maxRate}" step="0.01" data-commission-field="rate" value="${item.rate || ''}" ${readOnly ? 'disabled' : ''}></div>${capFields(item, '', readOnly, `${tierIndex}:${itemIndex}`)}</article>`).join('')}</div>${readOnly ? '' : `<button type="button" class="text-button" data-add-commission-item="${tierIndex}">＋ 添加品类计算项</button>`}`;
  }

  function renderTierValues(templateId, values, readOnly, tierIndex) {
    if (['category-commission', 'category-secondary-commission'].includes(templateId)) return renderCommissionItems(values, readOnly, tierIndex, templateId);
    if (templateId === 'newcomer-reward') return `<div class="field"><label>新人成交奖励（元）</label><input type="number" min="0.01" step="0.01" data-tier-field="amount" data-tier-index="${tierIndex}" value="${values.amount || ''}" ${readOnly ? 'disabled' : ''}></div>`;
    if (templateId === 'daily-video') return `<div class="field"><label>每日下载条数</label><input type="number" min="1" step="1" data-tier-field="dailyQuota" data-tier-index="${tierIndex}" value="${values.dailyQuota || ''}" ${readOnly ? 'disabled' : ''}></div><p class="tier-rule-note">当日结算，每日24:00清零；等级变化次日生效。</p>`;
    if (templateId === 'monthly-appraisal') return `<div class="field"><label>每月鉴定次数</label><input type="number" min="1" step="1" data-tier-field="monthlyQuota" data-tier-index="${tierIndex}" value="${values.monthlyQuota || ''}" ${readOnly ? 'disabled' : ''}></div><p class="tier-rule-note">自然月结算，月末清零；等级变化次日生效。</p>`;
    return `<div class="field"><label>${templateId === 'management-income' ? '管理收益比例' : '团队佣金比例'}（%）</label><input type="number" min="0.01" max="20" step="0.01" data-tier-field="rate" data-tier-index="${tierIndex}" value="${values.rate || ''}" ${readOnly ? 'disabled' : ''}></div>${capFields(values, '', readOnly, tierIndex)}`;
  }

  function renderBenefitTierEditor(templateId, tiers, readOnly) {
    if (!templateId) return '<p class="empty-copy">选择规则模板后再配置参数档位。</p>';
    return `<div class="tier-toolbar"><span>等级绑定权益时选择档位，档位名称和参数摘要会同步展示。</span>${readOnly ? '' : '<div><button type="button" class="text-button" data-copy-benefit-tier>复制上一档</button><button type="button" class="button" data-add-benefit-tier>＋ 新增档位</button></div>'}</div><div class="benefit-tiers">${tiers.map((tier, index) => `<article class="benefit-tier-card" data-benefit-tier data-tier-id="${tier.id}"><header><div><strong>${tier.name}</strong><small>${model.summarizeBenefitTier({ templateId }, tier)}</small></div>${readOnly ? '' : `<button type="button" class="danger-link" data-remove-benefit-tier="${index}">删除</button>`}</header><div class="field"><label>档位名称</label><input data-tier-name data-tier-index="${index}" value="${tier.name}" ${readOnly ? 'disabled' : ''} placeholder="例如：基础档"></div>${renderTierValues(templateId, tier.values || {}, readOnly, index)}</article>`).join('')}</div>`;
  }

  function benefitChangeTimeline(history) {
    if (!(history || []).length) return '<p class="empty-copy">暂无变更日志。</p>';
    return `<ul class="timeline benefit-change-timeline">${[...history].reverse().map((entry) => `<li><strong>${entry.action} · ${entry.time}</strong><span>${entry.operator || '当前运营'} · ${entry.effective || '实时生效'}</span>${entry.before !== undefined ? `<small><b>修改前</b>${JSON.stringify(entry.before)}</small>` : ''}${entry.after !== undefined ? `<small><b>修改后</b>${JSON.stringify(entry.after)}</small>` : ''}</li>`).join('')}</ul>`;
  }

  function readBenefitTiersFromForm() {
    const root = benefitFormRoot();
    const tierCards = [...root.querySelectorAll('[data-benefit-tier]')];
    if (!tierCards.length) return state.benefitTierDraft;
    return tierCards.map((card) => {
      const id = card.dataset.tierId;
      const name = card.querySelector('[data-tier-name]').value.trim();
      if (['category-commission', 'category-secondary-commission'].includes(state.benefitTemplateDraft)) {
        const items = [...card.querySelectorAll('[data-commission-item]')].map((item) => ({
          categories: [...item.querySelectorAll('[data-commission-category]:checked')].map((input) => input.value),
          rate: Number(item.querySelector('[data-commission-field="rate"]').value),
          capType: item.querySelector('[data-tier-field="capType"]').value,
          capAmount: Number(item.querySelector('[data-tier-field="capAmount"]').value || 0),
        }));
        return { id, name, values: { items } };
      }
      const values = {};
      card.querySelectorAll('[data-tier-field]').forEach((input) => {
        const field = input.dataset.tierField;
        values[field] = field.endsWith('Type') ? input.value : Number(input.value || 0);
      });
      return { id, name, values };
    });
  }

  function rerenderBenefitTierEditor() {
    const editor = benefitFormRoot().querySelector('[data-tier-editor]');
    if (editor) editor.innerHTML = renderBenefitTierEditor(state.benefitTemplateDraft, state.benefitTierDraft, false);
  }

  function validateBenefitTiers(templateId, tiers) {
    if (!templateId) return { valid: false, error: '请选择规则模板' };
    if (!tiers.length) return { valid: false, error: '参数化权益至少配置一个参数档位' };
    if (tiers.some((tier) => !tier.id || !tier.name)) return { valid: false, error: '请填写档位名称' };
    if (new Set(tiers.map((tier) => tier.id)).size !== tiers.length) return { valid: false, error: '参数档位 ID 不可重复' };
    if (new Set(tiers.map((tier) => tier.name)).size !== tiers.length) return { valid: false, error: '档位名称不可重复' };
    for (const tier of tiers) {
      const validation = model.validateBenefitConfiguration(templateId, tier.values);
      if (!validation.valid) return { valid: false, error: `${tier.name}：${validation.errors[0]}` };
    }
    return { valid: true };
  }

  function emptyBenefit() {
    return { name: '', category: '运营类', icon: '权', order: 30, kind: 'fixed', templateId: '', tiers: [], history: [], shortDescription: '', detailDescription: '', status: '生效中' };
  }

  function benefitFormRoot() {
    return state.benefitEditorOpen ? content : drawerBody;
  }

  function benefitFormMarkup(item, readOnly) {
    const disabled = readOnly ? 'disabled' : '';
    const templates = model.getRuleTemplates();
    const displaySection = `<section class="form-section benefit-display-section"><div class="form-section-title"><strong>前台展示信息</strong><span>${readOnly ? '只读查看' : '保存后实时执行'}</span></div><div class="field"><label>权益名称</label><input id="benefit-name" value="${item.name}" ${disabled} placeholder="请输入权益名称"></div><div class="field-row equal"><div class="field"><label>权益类别</label><select id="benefit-category" ${disabled}>${['收益类','运营类','证书类','鉴定类'].map((value) => `<option ${item.category === value ? 'selected' : ''}>${value}</option>`).join('')}</select></div><div class="field"><label>展示排序</label><input id="benefit-order" type="number" min="1" step="10" value="${item.order || 10}" ${disabled}></div></div><div class="field"><label>短说明</label><input id="benefit-short-description" value="${item.shortDescription || item.description || ''}" ${disabled} placeholder="用于权益卡片摘要"></div><div class="field"><label>详细说明</label><textarea id="benefit-detail-description" ${disabled} placeholder="用于权益详情和规则说明">${item.detailDescription || item.description || ''}</textarea></div></section>`;
    const ruleSection = `<section class="form-section benefit-rule-section"><div class="form-section-title"><strong>业务规则</strong><span>规则归属权益，等级仅选择权益与档位</span></div><div class="benefit-rule-grid"><div class="field"><label>权益类型</label><select id="benefit-kind" ${disabled}><option value="fixed" ${item.kind !== 'parameterized' ? 'selected' : ''}>固定权益</option><option value="parameterized" ${item.kind === 'parameterized' ? 'selected' : ''}>参数化权益</option></select></div><div class="field"><label>当前状态</label><select id="benefit-status" ${disabled}><option ${item.status === '生效中' ? 'selected' : ''}>生效中</option><option ${item.status === '已暂停' ? 'selected' : ''}>已暂停</option></select></div><div class="field benefit-template-field" data-template-field ${item.kind !== 'parameterized' ? 'hidden' : ''}><label>规则模板</label><select id="benefit-template" ${disabled}><option value="">请选择模板</option>${templates.map((template) => `<option value="${template.id}" ${item.templateId === template.id ? 'selected' : ''}>${template.name}</option>`).join('')}</select><small>模板只定义参数和固定口径，实际值保存在当前权益。</small>${readOnly || !item.templateId ? '' : '<button type="button" class="text-button" data-clear-benefit-rule>清空规则配置后切换模板</button>'}</div></div></section>`;
    const tierSection = `<section class="form-section benefit-tier-section" data-tier-section ${item.kind !== 'parameterized' ? 'hidden' : ''}><div class="form-section-title"><strong>参数档位</strong><span>完整参数快照 · 实时生效</span></div><div data-tier-editor>${renderBenefitTierEditor(item.templateId, state.benefitTierDraft, readOnly)}</div></section>`;
    const logSection = `<section class="form-section benefit-log-section"><div class="form-section-title"><strong>变更日志</strong><span>记录修改前后、操作人和时间</span></div>${benefitChangeTimeline(item.history)}</section>`;
    if (readOnly) return `${displaySection}${ruleSection}${tierSection}${logSection}`;
    return `<div class="benefit-editor-column benefit-editor-main">${displaySection}${logSection}</div><div class="benefit-editor-column benefit-editor-rules">${ruleSection}${tierSection}</div>`;
  }

  function prepareBenefitForm(mode, id) {
    const item = id ? benefits.find((benefit) => benefit.id === id) : emptyBenefit();
    state.benefitMode = mode;
    state.editingBenefit = id || null;
    state.benefitTierDraft = JSON.parse(JSON.stringify(item.tiers || []));
    state.benefitTemplateDraft = item.templateId || '';
    state.benefitTemplateWasCleared = false;
    return item;
  }

  function renderBenefitEditorPage() {
    const item = state.editingBenefit ? benefits.find((benefit) => benefit.id === state.editingBenefit) : emptyBenefit();
    const title = state.benefitMode === 'create' ? '新建权益' : `编辑权益 · ${item.name}`;
    return `<section class="benefit-editor-page"><header class="benefit-editor-head"><div class="benefit-editor-title"><button type="button" class="text-button" data-back-benefit-library>← 返回权益库</button><span>权益库管理</span><h1>${title}</h1><p>配置展示信息、规则模板与参数档位，保存后实时执行。</p></div><div class="benefit-editor-actions"><button type="button" class="button" data-back-benefit-library>取消</button><button type="button" class="primary-button" data-save-benefit>${state.benefitMode === 'create' ? '创建权益' : '保存修改'}</button></div></header><div class="benefit-editor-layout">${benefitFormMarkup(item, false)}</div></section>`;
  }

  function openBenefitEditor(mode, id) {
    prepareBenefitForm(mode, id);
    state.benefitEditorOpen = true;
    render();
  }

  function closeBenefitEditor() {
    state.benefitEditorOpen = false;
    state.editingBenefit = null;
    state.benefitTierDraft = [];
    state.benefitTemplateDraft = '';
    state.benefitTemplateWasCleared = false;
    render();
  }

  function openBenefitDrawer(mode, id) {
    const item = prepareBenefitForm(mode, id);
    openDrawer(`查看权益 · ${item.name}`, '权益库管理', benefitFormMarkup(item, true), '<button class="primary-button" data-close-drawer>关闭</button>');
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
      { id: 'operations', name: '操作记录' },
    ];
    const tabBar = `<nav class="drawer-tabs">${tabs.map((tab) => `<button type="button" data-agent-detail-tab="${tab.id}" class="${state.agentDetailTab === tab.id ? 'active' : ''}">${tab.name}</button>`).join('')}</nav>`;
    const profile = `<section class="agent-summary"><div><span>店主</span><strong>${agent.name} · ${agent.id}</strong></div><div><span>当前状态</span>${pill(agent.status)}</div><div><span>开通时间</span><strong>${agent.openedAt}</strong></div></section><section class="form-section"><div class="form-section-title"><strong>店铺资料</strong><span>与店主身份一对一</span></div><div class="reference-detail"><div><span>店铺名称</span><strong>${agent.storeName}</strong></div><div><span>店铺编号</span><strong>JX-${agent.id.replace('A','08')}</strong></div><div><span>店主等级</span><strong>${agent.identity}·${agent.level}</strong></div><div><span>手机号</span><strong>${agent.phone}</strong></div></div></section>`;
    const growth = `<section class="agent-summary single"><div><span>当前等级</span><strong>${agent.level} · ${agent.identity}</strong></div></section><section class="form-section next-level-card"><div class="form-section-title"><strong>下一等级进度</strong><span>${agent.progress}</span></div><div class="progress-track"><i style="width:${agent.progress}"></i></div><div class="metric-progress"><div><span>店铺客户</span><strong>${Math.min(agent.customers, 20)} / 20 人</strong><i><b style="width:${Math.min(agent.customers / 20 * 100, 100)}%"></b></i></div><div><span>店铺收益</span><strong>${agent.commission} / ¥10,000</strong><i><b style="width:86%"></b></i></div><div><span>团队店主</span><strong>${Math.min(agent.teamOwners, 20)} / 20 人</strong><i><b style="width:${Math.min(agent.teamOwners / 20 * 100, 100)}%"></b></i></div></div></section><section class="form-section"><div class="form-section-title"><strong>已获权益</strong><span>按当前等级和状态计算</span></div><div class="agent-benefits"><article><i>收</i><span><strong>鞋服业务收益</strong><small>生效中 · LV2发放</small></span></article><article><i>学</i><span><strong>深度线上运营培训</strong><small>生效中 · LV3发放</small></span></article></div></section>`;
    const upgradeHistory = `<section class="form-section"><div class="form-section-title"><strong>升级记录</strong><span>规则与指标快照永久保留</span></div><ul class="timeline"><li><strong>手动调整至 LV4 · 2026-08-02 14:20</strong><span>运营手动调整 · 操作人：陈运营 · 业务复核通过</span></li><li><strong>LV3 → LV4 · 2026-07-20 10:26</strong><span>自动升级 · 三项条件全部满足</span></li><li><strong>LV2 → LV3 · 2026-06-02 11:16</strong><span>自动升级</span></li><li><strong>LV1 → LV2 · 2026-05-18 09:30</strong><span>完成店主资格开通</span></li></ul></section>`;
    const income = `<section class="form-section"><div class="form-section-title"><strong>经营指标</strong><span>本月 · 数据更新于10:20</span></div><div class="reference-detail"><div><span>店铺客户（推广人数）</span><strong>${agent.customers}人</strong></div><div><span>团队有效订单</span><strong>${agent.orders}笔</strong></div><div><span>已结算店铺收益</span><strong>${agent.commission}</strong></div><div><span>待结算业务收益</span><strong>¥540.00</strong></div></div></section>`;
    const calculationLogs = `<section class="form-section"><div class="form-section-title"><strong>计算日志</strong><span>最近3条</span></div><ul class="timeline"><li><strong>周期校准 · 今天10:24</strong><span>规则版本${state.version} · 结果 ${agent.level}</span></li><li><strong>团队订单结算 · 昨天18:32</strong><span>指标快照已保存</span></li></ul></section>`;
    const operations = `<section class="form-section"><div class="form-section-title"><strong>操作记录</strong><span>人工调整永久留痕</span></div>${upgradeHistory}</section>`;
    const contentByTab = { profile, growth, income, logs: calculationLogs, operations };
    drawerBody.innerHTML = `${tabBar}${contentByTab[state.agentDetailTab]}`;
    drawerFooter.innerHTML = ['profile', 'growth'].includes(state.agentDetailTab) ? '<button class="primary-button" data-agent-action="level">手动调级</button>' : '<button class="primary-button" data-close-drawer>关闭</button>';
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
    publishContent.innerHTML = `<div class="preview-version"><span>当前版本 ${state.version}</span><b>→</b><span>待发布版本 ${preview.nextVersion}</span></div><div class="impact-grid"><article><span>受影响存量店主</span><strong>${preview.affectedAgents.toLocaleString()}</strong></article><article><span>预计立即升级</span><strong>${preview.immediateUpgrades}</strong></article><article><span>权益更新</span><strong>${preview.benefitUpdates}</strong></article></div><section class="publish-section"><div class="form-section-title"><strong>等级门槛变化</strong><span>${state.pendingChanges} 项待发布修改</span></div><div class="diff-list"><div><span>LV5 团队店主</span><del>≥ 18 人</del><b>→</b><ins>≥ 20 人</ins></div><div><span>LV8 店铺收益</span><del>≥ 36,000 元</del><b>→</b><ins>≥ 40,000 元</ins></div><div><span>LV12 升级方式</span><del>线上申请</del><b>→</b><ins>线下联系</ins></div></div></section><section class="publish-section"><div class="form-section-title"><strong>权益变化</strong><span>前台卡片与发放规则同步更新</span></div><div class="benefit-preview inherited"><span>LV5 新增：手机回收品类</span><span>LV8 新增：每月30条成片素材</span><span>运营类展示顺序已调整</span></div></section><section class="publish-section commission-diff"><div class="form-section-title"><strong>店铺收益方案变化</strong><span>历史订单保留原快照</span></div><div class="version-compare"><article><span>当前方案</span><strong>方案1.2</strong><p>鞋服品类 6%<br>手机品类 3%<br>计佣基数：最终回收价</p></article><i>→</i><article><span>待发布方案</span><strong>方案1.3</strong><p>鞋服品类 6.5%<br>手机品类 3.5%<br>计佣基数：实收净额</p></article></div></section><section class="publish-section"><div class="form-section-title"><strong>发布前校验</strong><span>全部通过</span></div><ul class="check-list"><li>等级门槛不存在倒挂</li><li>升级条件与店铺收益方案完整</li><li>权益引用均有效，无已停用权益</li><li>存量店主影响范围已生成</li></ul></section><section class="publish-section effective-options"><div class="form-section-title"><strong>生效时间</strong><span>发布后生成不可修改的版本记录</span></div><label><input type="radio" name="effective-time" value="now" checked><span><strong>立即生效</strong><small>发布完成后开始使用新规则</small></span></label><label><input type="radio" name="effective-time" value="scheduled"><span><strong>定时生效</strong><small>2026-08-06 00:00，可在生效前取消</small></span></label></section><div class="risk-note">新版本只影响生效后创建的订单，历史订单继续使用原店铺收益方案快照。</div>`;
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
    const body = compare ? `<div class="version-compare"><article><span>版本 ${version}</span><strong>调整前</strong><p>LV5 团队店主 ≥ 18 人<br>权益：基础素材库</p></article><i>→</i><article><span>版本 ${state.version}</span><strong>调整后</strong><p>LV5 团队店主 ≥ 20 人<br>新增：手机品类、专属素材</p></article></div>` : `<div class="version-detail-grid"><div><span>版本状态</span>${pill(item.status)}</div><div><span>生效时间</span><strong>${item.effectiveAt}</strong></div><div><span>操作人</span><strong>${item.operator}</strong></div><div><span>变更摘要</span><strong>${item.summary}</strong></div></div><ul class="check-list"><li>等级条件配置已保存</li><li>店铺收益方案引用有效</li><li>权益包快照已生成</li></ul>`;
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
    if (event.target.closest('[data-new-level]')) {
      const nextLevel = Math.max(...levels.map((item) => item.level)) + 1;
      openLevelDrawer(nextLevel, 'create');
    }
    const conditionToggle = event.target.closest('[data-condition-toggle]');
    if (conditionToggle) { const active = conditionToggle.classList.toggle('active'); conditionToggle.setAttribute('aria-pressed', String(active)); conditionToggle.querySelector('span').textContent = active ? '已启用' : '已停用'; }
    if (event.target.closest('[data-add-level-benefit]')) openBenefitPicker();
    const removeBenefit = event.target.closest('[data-remove-level-benefit]');
    if (removeBenefit) {
      const benefitId = removeBenefit.dataset.removeLevelBenefit;
      state.levelBenefitDraft = state.levelBenefitDraft.filter((id) => id !== benefitId);
      delete state.levelTierSelectionDraft[benefitId];
      renderLevelDrawer();
    }
    if (event.target.closest('[data-confirm-benefit-picker]')) {
      state.levelBenefitDraft = model.mergeBenefitSelection([], [...state.benefitPickerSelected]);
      state.levelBenefitDraft.forEach((benefitId) => {
        const benefit = benefits.find((item) => item.id === benefitId);
        if (benefit?.kind === 'parameterized' && !state.levelTierSelectionDraft[benefitId]) state.levelTierSelectionDraft[benefitId] = benefit.tiers[0]?.id;
      });
      benefitPickerModal.hidden = true; renderLevelDrawer(); showToast('等级权益已更新，请保存等级规则');
    }

    const saveLevel = event.target.closest('[data-save-level]');
    if (saveLevel) {
      const level = Number(saveLevel.dataset.saveLevel);
      const validation = model.validateLevelTierSelections(levels, benefits, level, state.levelBenefitDraft, state.levelTierSelectionDraft);
      if (!validation.valid) { showToast(validation.error); return; }
      const row = state.levelMode === 'create' ? state.levelDraftRow : levels.find((item) => item.level === level);
      if (state.levelMode === 'create') {
        row.identity = drawerBody.querySelector('[data-level-identity]').value.trim();
        if (!row.identity) { showToast('请输入等级身份'); drawerBody.querySelector('[data-level-identity]').focus(); return; }
      }
      row.targets = [...drawerBody.querySelectorAll('[data-level-target]')].map((input) => Number(input.value));
      row.relation = drawerBody.querySelector('#level-relation').value;
      row.upgradeMode = drawerBody.querySelector('#level-upgrade-mode').value;
      row.benefitIds = state.levelBenefitDraft.slice();
      const previousSelections = model.resolveLevelTierSelections(levels, benefits, level - 1);
      row.tierSelections = Object.fromEntries(Object.entries(state.levelTierSelectionDraft).filter(([benefitId, tierId]) => previousSelections[benefitId] !== tierId));
      row.benefits = row.benefitIds.map((id) => benefits.find((item) => item.id === id)?.name).filter(Boolean).join('、') || '暂无增量权益';
      row.condition = `店铺客户${row.targets[0]}｜店铺收益¥${row.targets[1].toLocaleString()}｜团队店主${row.targets[2]}`;
      if (state.levelMode === 'create') levels.push(row);
      state.pendingChanges += 1;
      closeDrawer(); render(); showToast(`LV${row.level}等级与权益已保存并实时生效`);
    }

    if (event.target.closest('[data-new-benefit]')) openBenefitEditor('create');
    const viewBenefit = event.target.closest('[data-view-benefit]');
    if (viewBenefit) openBenefitDrawer('view', viewBenefit.dataset.viewBenefit);
    const editBenefit = event.target.closest('[data-edit-benefit]');
    if (editBenefit) openBenefitEditor('edit', editBenefit.dataset.editBenefit);
    if (event.target.closest('[data-back-benefit-library]')) closeBenefitEditor();
    if (event.target.closest('[data-clear-benefit-rule]')) {
      const original = benefits.find((benefit) => benefit.id === state.editingBenefit);
      const referencedLevels = original ? levels.filter((level) => level.benefitIds.includes(original.id)).map((level) => level.level) : [];
      if (referencedLevels.length) { showToast(`请先解除${referencedLevels.map((level) => `LV${level}`).join('、')}的权益引用`); return; }
      state.benefitTierDraft = [];
      state.benefitTemplateDraft = '';
      state.benefitTemplateWasCleared = true;
      benefitFormRoot().querySelector('#benefit-template').value = '';
      rerenderBenefitTierEditor();
      showToast('规则配置已清空，请选择新模板或改为固定权益');
    }
    if (event.target.closest('[data-add-benefit-tier]')) {
      state.benefitTierDraft = readBenefitTiersFromForm();
      const nextNumber = Math.max(0, ...state.benefitTierDraft.map((tier) => Number(String(tier.id).replace(/^T/, '')) || 0)) + 1;
      state.benefitTierDraft.push({ id: `T${nextNumber}`, name: `档位 ${nextNumber}`, values: {} });
      rerenderBenefitTierEditor();
    }
    if (event.target.closest('[data-copy-benefit-tier]')) {
      state.benefitTierDraft = readBenefitTiersFromForm();
      const previous = state.benefitTierDraft.at(-1);
      if (!previous) { showToast('请先新增一个参数档位'); }
      else {
        const nextNumber = Math.max(0, ...state.benefitTierDraft.map((tier) => Number(String(tier.id).replace(/^T/, '')) || 0)) + 1;
        state.benefitTierDraft.push({ id: `T${nextNumber}`, name: `档位 ${nextNumber}`, values: JSON.parse(JSON.stringify(previous.values)) });
        rerenderBenefitTierEditor();
      }
    }
    const removeTier = event.target.closest('[data-remove-benefit-tier]');
    if (removeTier) {
      state.benefitTierDraft = readBenefitTiersFromForm();
      const targetTier = state.benefitTierDraft[Number(removeTier.dataset.removeBenefitTier)];
      const original = state.editingBenefit ? benefits.find((benefit) => benefit.id === state.editingBenefit) : null;
      const removal = model.canRemoveBenefitTier(original?.id, targetTier.id, levels);
      if (!removal.allowed) showToast(removal.reason);
      else { state.benefitTierDraft.splice(Number(removeTier.dataset.removeBenefitTier), 1); rerenderBenefitTierEditor(); }
    }
    const addCommissionItem = event.target.closest('[data-add-commission-item]');
    if (addCommissionItem) {
      state.benefitTierDraft = readBenefitTiersFromForm();
      const tier = state.benefitTierDraft[Number(addCommissionItem.dataset.addCommissionItem)];
      tier.values.items = tier.values.items || [];
      tier.values.items.push({ categories: [], rate: 0, capType: 'capped', capAmount: 0 });
      rerenderBenefitTierEditor();
    }
    const removeCommissionItem = event.target.closest('[data-remove-commission-item]');
    if (removeCommissionItem) {
      state.benefitTierDraft = readBenefitTiersFromForm();
      const [tierIndex, itemIndex] = removeCommissionItem.dataset.removeCommissionItem.split(':').map(Number);
      const tier = state.benefitTierDraft[tierIndex];
      tier.values.items.splice(itemIndex, 1);
      rerenderBenefitTierEditor();
    }
    const saveBenefit = event.target.closest('[data-save-benefit]');
    if (saveBenefit) {
      const root = benefitFormRoot();
      const kind = root.querySelector('#benefit-kind').value;
      const templateId = kind === 'parameterized' ? root.querySelector('#benefit-template').value : '';
      const tiers = kind === 'parameterized' ? readBenefitTiersFromForm() : [];
      if (kind === 'parameterized') {
        const validation = validateBenefitTiers(templateId, tiers);
        if (!validation.valid) { showToast(validation.error); return; }
      }
      const input = {
        name: root.querySelector('#benefit-name').value,
        category: root.querySelector('#benefit-category').value,
        order: Number(root.querySelector('#benefit-order').value),
        shortDescription: root.querySelector('#benefit-short-description').value,
        detailDescription: root.querySelector('#benefit-detail-description').value,
        description: root.querySelector('#benefit-short-description').value,
        status: root.querySelector('#benefit-status').value,
        kind,
        templateId,
        tiers,
      };
      if (state.editingBenefit) {
        const original = benefits.find((item) => item.id === state.editingBenefit);
        const mutation = model.canMutateBenefit(original.id, onlineReferencedBenefitIds());
        if (original.status === '生效中' && input.status === '已暂停' && !mutation.allowed) { showToast(mutation.reason); return; }
        const referencedLevels = levels.filter((level) => level.benefitIds.includes(original.id)).map((level) => level.level);
        const usedTierIds = [...new Set(levels.map((level) => level.tierSelections?.[original.id]).filter(Boolean))];
        const ruleMutation = model.canUpdateBenefitRule(original, input, referencedLevels, { templateWasCleared: state.benefitTemplateWasCleared, usedTierIds });
        if (!ruleMutation.allowed) { showToast(ruleMutation.reason); return; }
        input.history = model.appendBenefitChangeLog(original.history, { action: '修改权益与参数档位', before: { templateId: original.templateId, tiers: original.tiers }, after: { templateId, tiers }, operator: '当前运营', time: '2026-08-12 10:30' });
      } else {
        input.history = model.appendBenefitChangeLog([], { action: '创建权益', before: null, after: { templateId, tiers }, operator: '当前运营', time: '2026-08-12 10:30' });
      }
      const result = state.benefitMode === 'create' ? model.createBenefit(benefits, input) : model.updateBenefit(benefits, state.editingBenefit, input);
      if (!result.ok) { showToast(result.error); root.querySelector('#benefit-name').focus(); }
      else { const action = state.benefitMode; benefits = model.sortBenefits(result.records); state.pendingChanges += 1; closeBenefitEditor(); showToast(action === 'create' ? '权益已创建并实时生效' : '权益修改已保存并实时生效'); }
    }
    const toggleBenefit = event.target.closest('[data-toggle-benefit]');
    if (toggleBenefit) {
      const item = benefits.find((benefit) => benefit.id === toggleBenefit.dataset.toggleBenefit);
      const mutation = model.canMutateBenefit(item.id, onlineReferencedBenefitIds());
      if (item.status === '生效中' && !mutation.allowed) showToast(mutation.reason);
      else {
        const nextStatus = item.status === '生效中' ? '已暂停' : '生效中';
        const history = model.appendBenefitChangeLog(item.history, { action: nextStatus === '已暂停' ? '停用权益' : '恢复权益', before: { status: item.status }, after: { status: nextStatus }, operator: '当前运营', time: '2026-08-12 10:30' });
        const result = model.updateBenefit(benefits, item.id, { status: nextStatus, history });
        benefits = result.records; state.pendingChanges += 1; render(); showToast(`${item.name}状态已实时更新`);
      }
    }
    const deleteBenefit = event.target.closest('[data-delete-benefit]');
    if (deleteBenefit) {
      const item = benefits.find((benefit) => benefit.id === deleteBenefit.dataset.deleteBenefit);
      const mutation = model.canMutateBenefit(item.id, onlineReferencedBenefitIds());
      if (!mutation.allowed) showToast(mutation.reason);
      else openConfirm('删除权益', `确认删除“${item.name}”？删除后不可恢复。`, '确认删除', () => {
        benefitAuditLogs.push({ action: '删除权益', benefitId: item.id, benefitName: item.name, before: item, operator: '当前运营', time: '2026-08-12 10:30', effective: '实时生效' });
        const result = model.deleteBenefit(benefits, item.id, onlineReferencedBenefitIds());
        if (!result.ok) showToast(result.error);
        else { benefits = result.records; state.pendingChanges += 1; render(); showToast('权益已删除并实时生效'); }
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
    if (event.target.matches('[data-level-tier-selection]')) state.levelTierSelectionDraft[event.target.dataset.levelTierSelection] = event.target.value;
    if (event.target.matches('#benefit-kind')) {
      const parameterized = event.target.value === 'parameterized';
      benefitFormRoot().querySelector('[data-template-field]').hidden = !parameterized;
      benefitFormRoot().querySelector('[data-tier-section]').hidden = !parameterized;
      if (!parameterized) { state.benefitTemplateDraft = ''; state.benefitTierDraft = []; }
    }
    if (event.target.matches('#benefit-template')) {
      const original = state.editingBenefit ? benefits.find((benefit) => benefit.id === state.editingBenefit) : null;
      const referencedLevels = original ? levels.filter((level) => level.benefitIds.includes(original.id)).map((level) => level.level) : [];
      const mutation = model.canChangeBenefitTemplate({ tiers: readBenefitTiersFromForm() }, referencedLevels);
      if (original && event.target.value !== original.templateId && !mutation.allowed) { showToast(mutation.reason); event.target.value = original.templateId; return; }
      state.benefitTemplateDraft = event.target.value;
      state.benefitTierDraft = event.target.value ? [{ id: 'T1', name: '档位 1', values: {} }] : [];
      rerenderBenefitTierEditor();
    }
    if (event.target.matches('[data-tier-field="capType"], [data-tier-field$="CapType"]')) {
      const field = event.target.dataset.tierField.replace('Type', 'Amount');
      const scope = event.target.closest('[data-commission-item]') || event.target.closest('[data-benefit-tier]');
      const amount = scope.querySelector(`[data-tier-field="${field}"]`);
      amount.disabled = event.target.value === 'unlimited';
      if (amount.disabled) amount.value = '';
    }
    if (event.target.matches('[data-benefit-kind-filter]')) { state.benefitKindFilter = event.target.value; render(); }
    if (event.target.matches('[data-benefit-template-filter]')) { state.benefitTemplateFilter = event.target.value; render(); }
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

  setInterval(refreshDashboardLiveTime, 1000);
  render();
})();
