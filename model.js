(function (root) {
  const migrationMap = {
    成长代理: 'LV2',
    轻享代理: 'LV5',
    星享代理: 'LV8',
    超级代理: 'LV11',
    超级合伙人: 'LV12',
  };

  const migrationIdentityMap = {
    成长代理: '成长店主',
    轻享代理: '轻享店主',
    星享代理: '星享店主',
    超级代理: '超级店主',
    超级合伙人: '超级合伙人',
  };

  const adminMenu = [{
    id: 'owner-management',
    name: '店主管理',
    children: [
      { id: 'dashboard', name: '经营总览', defaultTab: 'dashboard' },
      { id: 'owners', name: '店主与开店', defaultTab: 'owners' },
      { id: 'levels', name: '等级与权益', defaultTab: 'levels' },
    ],
  }];

  const benefitCategoryOrder = {
    收益类: 0,
    运营类: 1,
    证书类: 2,
    鉴定类: 3,
  };

  const businessCategories = ['正品鞋', '正品服', '废旧手机', '普鞋', '旧衣', '旧书'];

  const ruleTemplates = [
    {
      id: 'newcomer-reward', name: '新人成交奖励', category: '收益类', readOnly: true,
      description: '平台新用户首次成功完成回收交易后，向归属店主发放一次奖励。',
      fixedRules: ['全平台仅首次有效订单', '订单取消或退款不撤销奖励', '按交易完成时实时参数执行'],
      parameters: [{ key: 'amount', label: '奖励金额', type: 'money', minExclusive: 0, decimals: 2, unit: '元' }],
    },
    {
      id: 'category-commission', name: '品类订单佣金', category: '收益类', readOnly: true,
      description: '按业务品类配置直属店主订单佣金。', fixedBase: '最终回收成交价',
      fixedRules: ['仅计算直属店主佣金', '单笔可设置封顶或上不封顶', '同一权益内品类不可重复'],
      parameters: [
        { key: 'categories', label: '业务品类', type: 'multi-select', options: businessCategories },
        { key: 'rate', label: '直属店主佣金比例', type: 'percent', minExclusive: 0, max: 100, decimals: 2, unit: '%' },
        { key: 'cap', label: '直属单笔封顶', type: 'cap', minExclusive: 0, decimals: 2, unit: '元' },
      ],
    },
    {
      id: 'category-secondary-commission', name: '品类二级订单佣金', category: '收益类', readOnly: true,
      description: '按业务品类配置上级店主的二级订单佣金。', fixedBase: '最终回收成交价',
      fixedRules: ['仅计算上级店主佣金', '单笔可设置封顶或上不封顶', '同一权益内品类不可重复'],
      parameters: [
        { key: 'categories', label: '业务品类', type: 'multi-select', options: businessCategories },
        { key: 'rate', label: '上级店主佣金比例', type: 'percent', minExclusive: 0, max: 50, decimals: 2, unit: '%' },
        { key: 'cap', label: '上级单笔封顶', type: 'cap', minExclusive: 0, decimals: 2, unit: '元' },
      ],
    },
    {
      id: 'management-income', name: '开通店主与管理收益', category: '收益类', readOnly: true,
      description: '按直接开通的一级下属店主订单成交价计算管理收益。', fixedBase: '最终回收成交价',
      fixedRules: ['仅直接开通的一级下属店主', '按交易完成时实时参数执行'],
      parameters: [
        { key: 'rate', label: '管理收益比例', type: 'percent', minExclusive: 0, max: 20, decimals: 2, unit: '%' },
        { key: 'cap', label: '单笔封顶', type: 'cap', minExclusive: 0, decimals: 2, unit: '元' },
      ],
    },
    {
      id: 'team-commission', name: '团队佣金', category: '收益类', readOnly: true,
      description: '对系统判定范围内的每笔团队回收单计算佣金。', fixedBase: '最终回收成交价',
      fixedRules: ['团队及区域范围由系统固定', '运营仅配置比例和上限'],
      parameters: [
        { key: 'rate', label: '团队佣金比例', type: 'percent', minExclusive: 0, max: 20, decimals: 2, unit: '%' },
        { key: 'cap', label: '单笔封顶', type: 'cap', minExclusive: 0, decimals: 2, unit: '元' },
      ],
    },
    {
      id: 'daily-video', name: '每日视频下载', category: '运营类', readOnly: true,
      description: '按自然日提供视频素材下载额度。',
      fixedRules: ['每日24:00清零且不结转', '等级变化次日00:00生效'],
      parameters: [{ key: 'dailyQuota', label: '每日下载条数', type: 'integer', min: 1, unit: '条/日' }],
    },
    {
      id: 'monthly-appraisal', name: '每月鉴定次数', category: '鉴定类', readOnly: true,
      description: '按自然月提供鉴定服务次数。',
      fixedRules: ['月末清零且不结转', '等级变化次日00:00生效', '剩余次数取新月额度减当月已使用次数，不低于0'],
      parameters: [{ key: 'monthlyQuota', label: '每月鉴定次数', type: 'integer', min: 1, unit: '次/月' }],
    },
  ];

  function cloneValue(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getRuleTemplates() {
    return cloneValue(ruleTemplates);
  }

  function getBusinessCategories() {
    return businessCategories.slice();
  }

  function summarizeBenefitConfiguration(benefit) {
    const values = benefit && benefit.values || {};
    if (benefit.templateId === 'newcomer-reward') return `${values.amount || 0} 元`;
    if (['category-commission', 'category-secondary-commission'].includes(benefit.templateId)) {
      const items = values.items || [];
      const rates = items.map((item) => Number(item.rate)).filter(Number.isFinite);
      const cappedAmounts = items.filter((item) => item.capType === 'capped').map((item) => Number(item.capAmount)).filter(Number.isFinite);
      const capSummary = cappedAmounts.length ? `｜封顶 ${Math.max(...cappedAmounts)} 元` : items.some((item) => item.capType === 'unlimited') ? '｜上不封顶' : '';
      return `${items.length} 组品类｜${rates.length ? Math.min(...rates) : 0}% 起${capSummary}`;
    }
    if (['management-income', 'team-commission'].includes(benefit.templateId)) {
      return `${values.rate || 0}%｜${values.capType === 'capped' ? `封顶 ${values.capAmount || 0} 元` : '上不封顶'}`;
    }
    if (benefit.templateId === 'daily-video') return `每日 ${values.dailyQuota || 0} 条`;
    if (benefit.templateId === 'monthly-appraisal') return `每月 ${values.monthlyQuota || 0} 次`;
    return '完整规则参数';
  }

  function canAssignBenefit(benefit) {
    if (!benefit || benefit.kind !== 'parameterized') return { allowed: true };
    if (!benefit.templateId) return { allowed: false, reason: '参数化权益尚未选择规则模板' };
    const validation = validateBenefitConfiguration(benefit.templateId, benefit.values || {});
    if (!validation.valid) return { allowed: false, reason: `规则参数无效：${validation.errors[0]}` };
    return { allowed: true };
  }

  function resolveLevelBenefitIds(levelRecords, level) {
    const record = (levelRecords || []).find((item) => Number(item.level) === Number(level));
    return [...new Set(record && record.benefitIds || [])];
  }

  function validateLevelBenefitSelection(levelRecords, benefits, level, benefitIds) {
    const templateIds = new Set();
    for (const benefitId of benefitIds || []) {
      const benefit = (benefits || []).find((item) => item.id === benefitId);
      if (benefit && benefit.kind === 'parameterized' && benefit.templateId) {
        if (templateIds.has(benefit.templateId)) return { valid: false, error: '同一权益规则只能选择一项权益' };
        templateIds.add(benefit.templateId);
      }
    }
    const allBenefitIds = [...new Set(benefitIds || [])];
    for (const benefitId of allBenefitIds) {
      const benefit = (benefits || []).find((item) => item.id === benefitId);
      if (!benefit) return { valid: false, error: `权益 ${benefitId} 不存在` };
      const assignment = canAssignBenefit(benefit);
      if (!assignment.allowed) return { valid: false, error: `${benefit.name || benefit.id}：${assignment.reason}` };
    }
    return { valid: true };
  }

  function canChangeBenefitTemplate(benefit, referencedLevels) {
    if (benefit && Object.keys(benefit.values || {}).length) return { allowed: false, reason: '请先清空规则参数后再切换模板' };
    if ((referencedLevels || []).length) return { allowed: false, reason: '请先移除等级引用后再切换模板' };
    return { allowed: true };
  }

  function canUpdateBenefitRule(original, next, referencedLevels, options) {
    const references = referencedLevels || [];
    const templateWasCleared = Boolean(options && options.templateWasCleared);
    if (references.length && original.kind !== next.kind) return { allowed: false, reason: '该权益已被等级引用，请先解除引用后再修改权益形态' };
    if (references.length && original.templateId !== next.templateId) return { allowed: false, reason: '该权益已被等级引用，请先解除引用后再切换模板' };
    if (original.templateId !== next.templateId && !templateWasCleared && (Object.keys(original.values || {}).length || references.length)) {
      return { allowed: false, reason: '请先解除等级引用并清空规则参数后再切换模板' };
    }
    if (next.kind === 'parameterized' && !validateBenefitConfiguration(next.templateId, next.values || {}).valid) return { allowed: false, reason: '请填写完整有效的规则参数' };
    return { allowed: true };
  }

  function positiveNumber(value, max) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 && (max === undefined || number <= max);
  }

  function hasAtMostTwoDecimals(value) {
    const number = Number(value);
    return Number.isFinite(number) && Math.abs(number * 100 - Math.round(number * 100)) < 1e-8;
  }

  function validateCap(values, prefix, errors) {
    const typeKey = prefix ? `${prefix}CapType` : 'capType';
    const amountKey = prefix ? `${prefix}CapAmount` : 'capAmount';
    if (!['capped', 'unlimited'].includes(values[typeKey])) errors.push('请选择封顶方式');
    if (values[typeKey] === 'capped' && !positiveNumber(values[amountKey])) {
      errors.push('选择封顶时必须填写大于0的封顶金额');
    }
    if (values[typeKey] === 'capped' && positiveNumber(values[amountKey]) && !hasAtMostTwoDecimals(values[amountKey])) errors.push('金额最多保留两位小数');
  }

  function validateCategoryCommission(values, maxRate, rateLabel) {
    const errors = [];
    const usedCategories = new Set();
    (values.items || []).forEach((item) => {
      const categories = item.categories || [];
      if (!categories.length || categories.some((category) => !businessCategories.includes(category))) errors.push('请选择有效业务品类');
      if (categories.some((category) => usedCategories.has(category))) errors.push('同一权益内业务品类不可重复');
      categories.forEach((category) => usedCategories.add(category));
      if (!positiveNumber(item.rate, maxRate)) errors.push(`${rateLabel}必须大于0且不超过${maxRate}%`);
      if (positiveNumber(item.rate, maxRate) && !hasAtMostTwoDecimals(item.rate)) errors.push('比例最多保留两位小数');
      validateCap(item, '', errors);
    });
    if (!(values.items || []).length) errors.push('至少配置一个品类计算项');
    return errors;
  }

  function validateBenefitConfiguration(templateId, values) {
    const errors = [];
    if (!ruleTemplates.some((item) => item.id === templateId)) return { valid: false, errors: ['未找到规则模板'] };

    if (templateId === 'newcomer-reward' && !positiveNumber(values.amount)) errors.push('奖励金额必须大于0');
    if (templateId === 'newcomer-reward' && positiveNumber(values.amount) && !hasAtMostTwoDecimals(values.amount)) errors.push('金额最多保留两位小数');
    if (templateId === 'daily-video' && (!Number.isInteger(Number(values.dailyQuota)) || Number(values.dailyQuota) < 1)) errors.push('每日下载条数必须为正整数');
    if (templateId === 'monthly-appraisal' && (!Number.isInteger(Number(values.monthlyQuota)) || Number(values.monthlyQuota) < 1)) errors.push('每月鉴定次数必须为正整数');
    if (['management-income', 'team-commission'].includes(templateId)) {
      if (!positiveNumber(values.rate, 20)) errors.push('比例必须大于0且不超过20%');
      if (positiveNumber(values.rate, 20) && !hasAtMostTwoDecimals(values.rate)) errors.push('比例最多保留两位小数');
      validateCap(values, '', errors);
    }
    if (templateId === 'category-commission') errors.push(...validateCategoryCommission(values, 100, '直属店主佣金比例'));
    if (templateId === 'category-secondary-commission') errors.push(...validateCategoryCommission(values, 50, '上级店主佣金比例'));
    return { valid: errors.length === 0, errors: [...new Set(errors)] };
  }

  function appendBenefitChangeLog(history, change) {
    return [...(history || []).map((item) => cloneValue(item)), { ...cloneValue(change), effective: '实时生效' }];
  }

  function getAdminMenu() {
    return adminMenu.map((group) => ({
      ...group,
      children: group.children.map((item) => ({ ...item })),
    }));
  }

  function upsertRegistration(records, input) {
    const rows = (records || []).map((item) => ({ ...item }));
    const index = rows.findIndex((item) => item.userId === input.userId);
    if (index >= 0) {
      rows[index] = { ...rows[index], ...input, updatedAt: '2026-08-07 10:20' };
      return { records: rows, updated: true };
    }
    rows.push({
      id: `R${String(rows.length + 1).padStart(3, '0')}`,
      opened: false,
      submittedAt: '2026-08-07 10:20',
      updatedAt: '2026-08-07 10:20',
      ...input,
    });
    return { records: rows, updated: false };
  }

  function openStoreOwner(registrationRecords, profileRecords, registrationId, operator) {
    const registrations = (registrationRecords || []).map((item) => ({ ...item }));
    const profiles = (profileRecords || []).map((item) => ({ ...item, nameHistory: (item.nameHistory || []).map((entry) => ({ ...entry })) }));
    const registration = registrations.find((item) => item.id === registrationId);
    if (!registration) return { ok: false, registrations, profiles, error: '未找到开店登记' };
    const existing = profiles.find((item) => item.userId === registration.userId);
    if (existing) return { ok: true, registrations, profiles, profile: existing, idempotent: true };
    const profile = {
      id: `S${String(profiles.length + 1).padStart(4, '0')}`,
      userId: registration.userId,
      ownerName: registration.nickname || registration.realName || '新店主',
      storeName: String(registration.storeName || '').trim() || `${registration.nickname || registration.realName || '新店主'}回收店`,
      storeNumber: `JX-${String(805168 + profiles.length)}`,
      level: 2,
      identity: '成长店主',
      status: '正常',
      openedAt: '2026-08-07 10:30',
      operator: operator || '当前运营',
      nameHistory: [],
    };
    profiles.push(profile);
    Object.assign(registration, { opened: true, operator: operator || '当前运营', operatedAt: '2026-08-07 10:30' });
    return { ok: true, registrations, profiles, profile, idempotent: false };
  }

  function renameStore(records, id, nextName, operator, reason) {
    const cleanName = String(nextName || '').trim();
    const cleanReason = String(reason || '').trim();
    const rows = (records || []).map((item) => ({ ...item, nameHistory: (item.nameHistory || []).map((entry) => ({ ...entry })) }));
    const profile = rows.find((item) => item.id === id);
    if (!profile) return { ok: false, records: rows, error: '未找到店铺资料' };
    if (!cleanName) return { ok: false, records: rows, error: '请输入店铺名称' };
    if (!cleanReason) return { ok: false, records: rows, error: '请填写修改原因' };
    if (profile.storeName === cleanName) return { ok: false, records: rows, error: '新店名不能与当前店名相同' };
    profile.nameHistory.push({ before: profile.storeName, after: cleanName, operator: operator || '当前运营', reason: cleanReason, time: '2026-08-07 10:36' });
    profile.storeName = cleanName;
    return { ok: true, records: rows };
  }

  function publishVersion(records, input) {
    const history = (records || []).map((record) => ({
      ...record,
      status: record.status === '生效中' ? '已失效' : record.status,
    }));
    history.push({
      version: input.version,
      status: '生效中',
      effectiveAt: input.effectiveAt || '立即生效',
      createdAt: input.createdAt || input.effectiveAt || '刚刚',
      operator: input.operator || '当前运营',
      summary: input.summary || '等级规则与权益配置更新',
    });
    return history;
  }

  function mergeBenefitSelection(current, selected, benefits) {
    const result = [...new Set(current || [])];
    (selected || []).forEach((benefitId) => {
      const benefit = (benefits || []).find((item) => item.id === benefitId);
      if (benefit && benefit.kind === 'parameterized' && benefit.templateId) {
        for (let index = result.length - 1; index >= 0; index -= 1) {
          const existing = (benefits || []).find((item) => item.id === result[index]);
          if (existing && existing.kind === 'parameterized' && existing.templateId === benefit.templateId) result.splice(index, 1);
        }
      }
      if (!result.includes(benefitId)) result.push(benefitId);
    });
    return result;
  }

  function nextBenefitId(records) {
    const max = (records || []).reduce((value, item) => Math.max(value, Number(String(item.id || '').replace(/\D/g, '')) || 0), 0);
    return `B${String(max + 1).padStart(2, '0')}`;
  }

  function createBenefit(records, input) {
    const name = String(input.name || '').trim();
    if (!name) return { ok: false, records: records.map((item) => ({ ...item })), error: '请输入权益名称' };
    if (records.some((item) => item.name === name)) return { ok: false, records: records.map((item) => ({ ...item })), error: '权益名称不可重复' };
    const { source: _ignoredSource, ...benefitInput } = input;
    return {
      ok: true,
      records: [...records.map((item) => ({ ...item })), {
        ...benefitInput,
        id: nextBenefitId(records),
        name,
        category: input.category || '运营类',
        icon: input.icon || '权',
        order: Number(input.order || 10),
        shortDescription: input.shortDescription || input.description || '暂无说明',
        detailDescription: input.detailDescription || input.description || '暂无说明',
        description: input.description || '暂无说明',
        status: input.status || '生效中',
      }],
    };
  }

  function updateBenefit(records, id, input) {
    const original = records.find((item) => item.id === id);
    if (!original) return { ok: false, records: records.map((item) => ({ ...item })), error: '未找到该权益' };
    const name = String(input.name === undefined ? original.name : input.name).trim();
    if (!name) return { ok: false, records: records.map((item) => ({ ...item })), error: '请输入权益名称' };
    if (records.some((item) => item.id !== id && item.name === name)) return { ok: false, records: records.map((item) => ({ ...item })), error: '权益名称不可重复' };
    const { source: _ignoredSource, ...benefitInput } = input;
    return {
      ok: true,
      records: records.map((item) => {
        if (item.id !== id) return { ...item };
        const { source: _legacySource, ...benefit } = item;
        return { ...benefit, ...benefitInput, name };
      }),
    };
  }

  function deleteBenefit(records, id, referencedIds) {
    if ((referencedIds || []).includes(id)) return { ok: false, records: records.map((item) => ({ ...item })), error: '该权益已被等级引用，无法删除' };
    if (!records.some((item) => item.id === id)) return { ok: false, records: records.map((item) => ({ ...item })), error: '未找到该权益' };
    return { ok: true, records: records.filter((item) => item.id !== id).map((item) => ({ ...item })) };
  }

  function sortBenefits(records) {
    return (records || []).map((item) => ({ ...item })).sort((left, right) => (
      (benefitCategoryOrder[left.category] ?? 99) - (benefitCategoryOrder[right.category] ?? 99)
      || Number(left.order || 0) - Number(right.order || 0)
      || String(left.id || '').localeCompare(String(right.id || ''), 'zh-CN')
    ));
  }

  function reorderBenefit(records, id, targetOrder) {
    const target = (records || []).find((item) => item.id === id);
    if (!target) return sortBenefits(records);

    const reorderedCategory = records
      .filter((item) => item.category === target.category)
      .map((item) => ({ ...item, order: item.id === id ? Number(targetOrder) : Number(item.order || 0) }))
      .sort((left, right) => left.order - right.order || String(left.id).localeCompare(String(right.id), 'zh-CN'))
      .map((item, index) => ({ ...item, order: (index + 1) * 10 }));
    const otherCategories = records
      .filter((item) => item.category !== target.category)
      .map((item) => ({ ...item }));

    return sortBenefits([...otherCategories, ...reorderedCategory]);
  }

  function canMutateBenefit(id, onlineReferencedIds) {
    if ((onlineReferencedIds || []).includes(id)) {
      return { allowed: false, reason: '该权益正在被当前线上版本引用，无法停用或删除' };
    }
    return { allowed: true };
  }

  function changeIssuanceStatus(records, id, action, reason) {
    const cleanReason = String(reason || '').trim();
    const originalRecords = (records || []).map((item) => ({
      ...item,
      history: (item.history || []).map((entry) => ({ ...entry })),
    }));
    if (!cleanReason) return { ok: false, records: originalRecords, error: '请填写操作原因' };

    const target = originalRecords.find((item) => item.id === id);
    if (!target) return { ok: false, records: originalRecords, error: '未找到权益发放记录' };
    if (target.status === '已失效') return { ok: false, records: originalRecords, error: '已失效权益不可操作' };

    const statusByAction = { 暂停: '已暂停', 恢复: '生效中' };
    const nextStatus = statusByAction[action];
    if (!nextStatus) return { ok: false, records: originalRecords, error: '不支持的操作' };

    target.status = nextStatus;
    target.history.push({ action, reason: cleanReason, time: '2026-08-05 16:40' });
    return { ok: true, records: originalRecords };
  }

  function validateRule(rule) {
    const errors = [];
    const enabled = (rule.conditions || []).filter((item) => item.enabled !== false);
    if (!enabled.length && rule.level >= 2 && rule.level <= 11) errors.push('至少启用一个升级条件');
    if (enabled.some((item) => !Number.isFinite(Number(item.target)) || Number(item.target) < 0)) errors.push('升级门槛必须为有效非负数');
    if (!rule.commissionVersion) errors.push('必须关联指定店铺收益方案版本');
    if (rule.level === 12 && rule.upgradeMode && rule.upgradeMode !== 'offline') errors.push('LV12必须使用线下联系');
    return { valid: errors.length === 0, errors };
  }

  function createPublishPreview(input) {
    const [major, minor] = String(input.currentVersion || '1.0').split('.').map(Number);
    return {
      nextVersion: `${major}.${minor + 1}`,
      affectedAgents: Number(input.affectedAgents) || 0,
      immediateUpgrades: Number(input.immediateUpgrades) || 0,
      benefitUpdates: Number(input.benefitUpdates) || 0,
      blocked: false,
    };
  }

  function retryCalculation(records, id) {
    const original = records.find((record) => record.id === id);
    if (!original) return records.slice();
    const retried = {
      ...original,
      id: `${original.id}-R${Number(original.attempt || 1) + 1}`,
      sourceId: original.id,
      status: '成功',
      attempt: Number(original.attempt || 1) + 1,
    };
    return [...records.map((record) => ({ ...record })), retried];
  }

  function runMigration(existing, agents) {
    const result = existing.map((record) => ({ ...record }));
    const completed = new Set(result.map((record) => record.id));
    agents.forEach((agent) => {
      if (completed.has(agent.id)) return;
      result.push({
        id: agent.id,
        oldIdentity: agent.oldIdentity,
        newLevel: migrationMap[agent.oldIdentity] || 'LV2',
        newIdentity: migrationIdentityMap[agent.oldIdentity] || '成长店主',
        status: '成功',
      });
      completed.add(agent.id);
    });
    return result;
  }

  root.AdminModel = {
    appendBenefitChangeLog,
    canAssignBenefit,
    canChangeBenefitTemplate,
    canUpdateBenefitRule,
    createBenefit,
    createPublishPreview,
    canMutateBenefit,
    changeIssuanceStatus,
    deleteBenefit,
    getBusinessCategories,
    getRuleTemplates,
    getAdminMenu,
    mergeBenefitSelection,
    publishVersion,
    openStoreOwner,
    renameStore,
    resolveLevelBenefitIds,
    retryCalculation,
    reorderBenefit,
    runMigration,
    sortBenefits,
    summarizeBenefitConfiguration,
    updateBenefit,
    upsertRegistration,
    validateBenefitConfiguration,
    validateLevelBenefitSelection,
    validateRule,
  };
})(globalThis);
