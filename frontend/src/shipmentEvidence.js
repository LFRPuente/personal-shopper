const evidenceTime = (item) => {
  const time = new Date((item && item.created_at) || 0).getTime();
  return Number.isFinite(time) ? time : 0;
};

export const sortShipmentEvidenceByNewest = (items = []) =>
  [...(Array.isArray(items) ? items : [])].sort((left, right) => {
    const timeDiff = evidenceTime(right) - evidenceTime(left);
    return timeDiff || Number((right && right.id) || 0) - Number((left && left.id) || 0);
  });
