export const DEFAULT_SALES_STATUS = 'pending';

export const SALES_STATUS_LABELS = {
  all: 'All',
  pending: 'New',
  connected: 'Connected',
  rejected: 'Rejected',
  hold: 'Holding',
  notConnected: 'Not Connected',
};

export const normalizeSalesStatus = (value) => {
  const normalized = String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[_\s-]+/g, '');

  if (!normalized || normalized === 'all') return 'all';

  if (
    [
      'success',
      'completed',
      'complete',
      'done',
      'converted',
      'connected',
    ].includes(normalized)
  ) {
    return 'connected';
  }

  if (
    [
      'rejected',
      'reject',
      'declined',
      'failed',
    ].includes(normalized)
  ) {
    return 'rejected';
  }

  if (
    [
      'hold',
      'holding',
      'onhold',
      'on_hold',
    ].includes(normalized)
  ) {
    return 'hold';
  }

  if (
    [
      'notconnected',
      'notconnectedlead',
      'notconnectedcalls',
    ].includes(normalized)
  ) {
    return 'notConnected';
  }

  if (
    ['pending', 'New', 'new', 'newlead', 'newstatus'].includes(normalized)
  ) {
    return 'pending';
  }

  return normalized;
};

export const createSalesManagementRoute = (
  campaignId,
  status = DEFAULT_SALES_STATUS
) => {
  if (!campaignId) {
    return '/sales-management';
  }

  return `/sales-management/${encodeURIComponent(
    campaignId
  )}/${normalizeSalesStatus(status)}`;
};

export const resolveSalesManagementTarget = (
  pathname = '/sales-management'
) => {
  const trimmed = String(pathname || '').replace(/\/+$/, '');

  if (
    !trimmed ||
    trimmed === '/sales-management' ||
    trimmed === '/tc/sales-management'
  ) {
    return {
      campaignId: null,
      status: DEFAULT_SALES_STATUS,
      showCampaignPicker: true,
    };
  }

  const match = trimmed.match(
    /^\/sales-management\/([^/]+)(?:\/([^/]+))?$/
  );

  if (!match) {
    return {
      campaignId: null,
      status: DEFAULT_SALES_STATUS,
      showCampaignPicker: true,
    };
  }

  const [, rawCampaignId, rawStatus] = match;

  return {
    campaignId: decodeURIComponent(rawCampaignId),
    status: normalizeSalesStatus(rawStatus || DEFAULT_SALES_STATUS),
    showCampaignPicker: false,
  };
};

export const doesLeadMatchStatus = (
  leadStatus,
  routeStatus
) => {
  const normalizedLead = normalizeSalesStatus(leadStatus);
  const normalizedRoute = normalizeSalesStatus(routeStatus);

  if (normalizedRoute === 'all') return true;

  if (normalizedLead === normalizedRoute) {
    return true;
  }

  const aliases = {
    connected: ['connected', 'success', 'complete'],
    rejected: ['rejected'],
    hold: ['hold'],
    notConnected: ['notConnected'],
    pending: ['pending', 'new', 'newlead', 'newstatus'],
  };

  return (
    aliases[normalizedRoute]?.includes(normalizedLead) ||
    false
  );
};
