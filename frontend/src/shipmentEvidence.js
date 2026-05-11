const evidenceTime = (item) => {
  const time = new Date((item && item.created_at) || 0).getTime();
  return Number.isFinite(time) ? time : 0;
};

export const sortShipmentEvidenceByNewest = (items = []) =>
  [...(Array.isArray(items) ? items : [])].sort((left, right) => {
    const timeDiff = evidenceTime(right) - evidenceTime(left);
    return timeDiff || Number((right && right.id) || 0) - Number((left && left.id) || 0);
  });

const productTime = (item) => {
  for (const key of ['created_at', 'purchase_date', 'shopping_date', 'mission_date']) {
    const time = new Date((item && item[key]) || 0).getTime();
    if (Number.isFinite(time) && time > 0) return time;
  }
  return 0;
};

export const sortShipmentProductsByNewest = (items = []) =>
  [...(Array.isArray(items) ? items : [])].sort((left, right) => {
    const timeDiff = productTime(right) - productTime(left);
    return timeDiff || Number((right && right.id) || 0) - Number((left && left.id) || 0);
  });
