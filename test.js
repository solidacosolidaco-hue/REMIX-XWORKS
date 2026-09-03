const getValidConnectionTargets = (sourceType) => {
  const map = {
    customer: ['order', 'note', 'document', 'group', 'text'],
    order: ['project', 'invoice', 'finalized_order', 'indicator', 'financial_module', 'note', 'document', 'group', 'text'],
    project: ['production', 'deadline', 'progress', 'kanban', 'checklist', 'document', 'indicator', 'note', 'group', 'text'],
    production: ['indicator', 'progress', 'checklist', 'note', 'document', 'group', 'text', 'kanban'],
    deadline: ['indicator', 'progress', 'note', 'group', 'text'],
    progress: ['indicator', 'deadline', 'note', 'group', 'text'],
    indicator: ['deadline', 'progress', 'note', 'group', 'text'],
    invoice: ['financial_module', 'note', 'document', 'group', 'text'],
    financial_module: ['indicator', 'note', 'group', 'text'],
    finalized_order: ['indicator', 'invoice', 'financial_module', 'note', 'group', 'text'],
    text: ['text', 'note', 'group', 'checklist', 'kanban', 'deadline', 'customer', 'order', 'project', 'production', 'indicator', 'progress', 'document', 'invoice', 'custom', 'finalized_order', 'financial_module'],
    note: ['text', 'note', 'group', 'checklist', 'kanban', 'deadline', 'customer', 'order', 'project', 'production', 'indicator', 'progress', 'document', 'invoice', 'custom', 'finalized_order', 'financial_module'],
    checklist: ['kanban', 'progress', 'note', 'group', 'text'],
    kanban: ['checklist', 'progress', 'note', 'group', 'text'],
    document: ['note', 'group', 'project', 'order', 'customer', 'text'],
    group: ['text', 'note', 'checklist', 'kanban', 'deadline', 'customer', 'order', 'project', 'production', 'indicator', 'progress', 'document', 'group', 'invoice', 'custom', 'finalized_order', 'financial_module'],
    custom: ['text', 'note', 'checklist', 'kanban', 'deadline', 'customer', 'order', 'project', 'production', 'indicator', 'progress', 'document', 'group', 'invoice', 'custom', 'finalized_order', 'financial_module'],
  };
  return map[sourceType] || [];
};
