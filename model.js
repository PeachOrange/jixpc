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
      { id: 'statuses', name: '状态管理', defaultTab: 'statuses' },
      { id: 'content', name: '内容管理', defaultTab: 'content' },
      { id: 'tasks', name: '任务中心', defaultTab: 'logs' },
    ],
  }];

  const benefitCategoryOrder = {
    收益类: 0,
    运营类: 1,
    鉴定类: 2,
  };

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

  function mergeBenefitSelection(current, selected) {
    return [...new Set([...(current || []), ...(selected || [])])];
  }

  function nextBenefitId(records) {
    const max = (records || []).reduce((value, item) => Math.max(value, Number(String(item.id || '').replace(/\D/g, '')) || 0), 0);
    return `B${String(max + 1).padStart(2, '0')}`;
  }

  function createBenefit(records, input) {
    const name = String(input.name || '').trim();
    if (!name) return { ok: false, records: records.map((item) => ({ ...item })), error: '请输入权益名称' };
    if (records.some((item) => item.name === name)) return { ok: false, records: records.map((item) => ({ ...item })), error: '权益名称不可重复' };
    return {
      ok: true,
      records: [...records.map((item) => ({ ...item })), {
        ...input,
        id: nextBenefitId(records),
        name,
        category: input.category || '运营类',
        icon: input.icon || '权',
        order: Number(input.order || 10),
        shortDescription: input.shortDescription || input.description || '暂无说明',
        detailDescription: input.detailDescription || input.description || '暂无说明',
        description: input.description || '暂无说明',
        source: input.source || '按等级配置',
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
    return {
      ok: true,
      records: records.map((item) => item.id === id ? { ...item, ...input, name } : { ...item }),
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
    createBenefit,
    createPublishPreview,
    canMutateBenefit,
    changeIssuanceStatus,
    deleteBenefit,
    getAdminMenu,
    mergeBenefitSelection,
    publishVersion,
    openStoreOwner,
    renameStore,
    retryCalculation,
    reorderBenefit,
    runMigration,
    sortBenefits,
    updateBenefit,
    upsertRegistration,
    validateRule,
  };
})(globalThis);
