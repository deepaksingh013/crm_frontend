import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Modal from '../../../components/modal/Modal';
import { toast } from 'react-hot-toast';


const STATUS_OPTIONS = [
  {
    value: 'success',
    label: 'Complete',
    description: 'Customer is successfully converted',
    icon: '✓',
    iconClass: 'bg-emerald-500 text-white',
  },
  {
    value: 'rejected',
    label: 'Reject',
    description: 'Lead has been rejected',
    icon: '×',
    iconClass: 'text-rose-600',
  },
  {
    value: 'hold',
    label: 'Holding',
    description: 'Follow up with customer later',
    icon: 'Ⅱ',
    iconClass: 'text-amber-600',
  },
  {
    value: 'notConnected',
    label: 'Not Connected',
    description: 'Customer could not be contacted',
    icon: '⊘',
    iconClass: 'text-slate-600',
  },
];

const STATUS_ALIASES = {
  success: [
    'success',
    'completed',
    'complete',
    'done',
    'converted',
  ],

  rejected: [
    'rejected',
    'reject',
    'declined',
    'failed',
  ],

  hold: [
    'hold',
    'holding',
    'onhold',
    'on_hold',
  ],

  notConnected: [
    'not_connected',
    'notconnected',
    'not connected',
    'not-connected',
    'notconnectedlead',
  ],
};

const API_STATUS_BY_VALUE = {
  success: 'Complete',
  rejected: 'Reject',
  hold: 'Holding',
  notConnected: 'Not Connected',
};


const NOT_CONNECTED_REASONS = [
  {
    value: 'Busy',
    label: 'Busy',
  },
  {
    value: 'Switched Off',
    label: 'Switched Off',
  },
  {
    value: 'No Answer',
    label: 'No Answer',
  },
  {
    value: 'Call Disconnected',
    label: 'Call Disconnected',
  },
  {
    value: 'Wrong Number',
    label: 'Wrong Number',
  },
  {
    value: 'Number Not Reachable',
    label: 'Number Not Reachable',
  },
  {
    value: 'Customer Asked to Call Later',
    label: 'Customer Asked to Call Later',
  },
  {
    value: 'Other',
    label: 'Other',
  },
];

const STATUS_FIELDS = {
  success: [
    {
      name: 'customerName',
      label: 'Customer Name',
      placeholder: 'Customer name',
      required: true,
      type: 'text',
      readOnly: true,
    },
    {
      name: 'customerPhone',
      label: 'Mobile Number',
      placeholder: 'Mobile number',
      required: true,
      type: 'tel',
      readOnly: true,
    },
    {
      name: 'alternateNumber',
      label: 'Alternate Number',
      placeholder: 'Enter alternate number',
      type: 'tel',
    },
    {
      name: 'pincode',
      label: 'Pincode',
      placeholder: 'Enter pincode',
      type: 'text',
    },
    {
      name: 'product',
      label: 'Product / Service',
      placeholder: 'Campaign name',
      type: 'text',
      readOnly: true,
    },
    {
      name: 'amount',
      label: 'Amount',
      placeholder: 'Enter amount',
      required: true,
      type: 'number',
    },
    {
      name: 'address',
      label: 'Customer Address',
      placeholder: 'Enter customer address',
      type: 'textarea',
      rows: 2,
      fullWidth: true,
    },
  ],

  hold: [
    {
      name: 'holdDate',
      label: 'Follow-up / Hold Date',
      required: true,
      type: 'date',
      minToday: true,
    },
  ],

  rejected: [
    {
      name: 'reason',
      label: 'Rejection Reason',
      placeholder: 'Enter rejection reason...',
      required: true,
      type: 'textarea',
      rows: 3,
    },
  ],

  notConnected: [
    {
      name: 'reason',
      label: 'Reason',
      required: true,
      type: 'select',
      options: NOT_CONNECTED_REASONS,
      placeholder: 'Select reason',
    },
  ],
};

const LEAD_FIELD_MAP = {
  customerName: [
    'name',
    'fullName',
    'customerName',
    'leadName',
  ],

  customerPhone: [
    'phone',
    'mobile',
    'phoneNumber',
    'contact',
  ],

  alternateNumber: [
    'alternateNumber',
    'alternate_number',
    'alternatePhone',
  ],

  pincode: [
    'pincode',
    'pinCode',
    'postalCode',
    'zipCode',
  ],

  address: [
    'address',
    'customerAddress',
    'location',
  ],

  product: [
    'product',
    'productName',
    'service',
  ],

  amount: [
    'amount',
    'saleAmount',
    'dealAmount',
  ],

  holdDate: [
    'holdDate',
    'holdUntil',
    'followUpDate',
  ],

  reason: [
    'reason',
    'rejectionReason',
    'notConnectedReason',
  ],

  remark: [
    'remark',
    'remarks',
    'comment',
    'comments',
  ],
};

const INITIAL_FORM = {
  customerName: '',
  customerPhone: '',
  alternateNumber: '',
  pincode: '',
  address: '',
  product: '',
  amount: '',
  holdDate: '',
  reason: '',
  remark: '',
};

const getLeadValue = (
  lead,
  keys = [],
  fallback = ''
) => {
  for (const key of keys) {
    const value = lead?.[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      return value;
    }
  }

  return fallback;
};

const getLeadId = (lead) => {
  if (!lead) return null;

  const id = getLeadValue(
    lead,
    ['_id', 'id', 'leadId', 'lead_id']
  );

  if (id) return id;

  if (
    lead.lead &&
    (lead.lead._id || lead.lead.id)
  ) {
    return lead.lead._id || lead.lead.id;
  }

  return null;
};

const getCampaignId = (lead) => {
  if (!lead) return null;

  const direct = getLeadValue(
    lead,
    [
      'campaignId',
      'campaign_id',
      'campaign',
    ]
  );

  if (direct) {
    if (typeof direct === 'object') {
      return direct._id || direct.id || null;
    }

    return direct;
  }

  if (
    lead.campaign &&
    (lead.campaign._id || lead.campaign.id)
  ) {
    return lead.campaign._id || lead.campaign.id;
  }

  return null;
};

const getCampaignName = (lead) => {
  const campaign = lead?.campaign;

  if (campaign && typeof campaign === 'object') {
    return campaign.name || campaign.title || '';
  }

  return lead?.campaignName || '';
};

const getToday = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();

  return new Date(
    date.getTime() - offset * 60 * 1000
  )
    .toISOString()
    .split('T')[0];
};

const normalizeStatus = (value) => {
  const normalized = String(value ?? '')
    .toLowerCase()
    .trim();

  if (!normalized) {
    return 'pending';
  }

  const found = Object.entries(
    STATUS_ALIASES
  ).find(([, aliases]) =>
    aliases.includes(normalized)
  );

  return found?.[0] || normalized;
};

const formatLeadId = (lead) =>
  String(
    getLeadValue(
      lead,
      ['leadId', 'id', '_id'],
      'N/A'
    )
  );

const getInitials = (name) => {
  if (!name) return 'LD';

  const initials = String(name)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return initials || 'LD';
};

const getToken = (authToken) => {
  if (authToken) {
    return authToken;
  }

  try {
    return Cookies.get('token') || null;
  } catch {
    return null;
  }
};

const getInitialForm = (lead) => {
  return Object.keys(INITIAL_FORM).reduce(
    (form, field) => {
      form[field] = getLeadValue(
        lead,
        LEAD_FIELD_MAP[field] || [],
        ''
      );

      return form;
    },
    { ...INITIAL_FORM }
  );
};


const validateForm = (status, form) => {
  if (!status) {
    return 'Please select a status.';
  }

  const fields =
    STATUS_FIELDS[status] || [];

  for (const field of fields) {
    if (!field.required) continue;

    const value = String(
      form[field.name] ?? ''
    ).trim();

    if (!value) {
      return `${field.label} is required.`;
    }
  }

  if (
    status === 'hold' &&
    form.holdDate &&
    form.holdDate < getToday()
  ) {
    return 'Hold date cannot be in the past.';
  }

  return null;
};

const buildPayload = (
  lead,
  form,
  statusOption
) => {

  const payload = {
    ...lead,

    name: String(
      form.customerName ?? ''
    ).trim(),

    mobile: String(
      form.customerPhone ?? ''
    ).trim(),

    alternateNumber:
      String(
        form.alternateNumber ?? ''
      ).trim() || null,

    pincode:
      String(
        form.pincode ?? ''
      ).trim() || null,

    address:
      String(
        form.address ?? ''
      ).trim() || null,

    status:
      API_STATUS_BY_VALUE[statusOption.value] ||
      statusOption.label,

    reason: String(
      form.reason ?? ''
    ).trim(),
  };

  
  if (statusOption.value === 'hold') {
    payload.holdDate =
      form.holdDate || null;
  } else {
    payload.holdDate = null;
  }

  payload.product =
    String(
      form.product ?? ''
    ).trim() || null;

  payload.amount =
    String(
      form.amount ?? ''
    ).trim() || null;

  payload.remark =
    String(
      form.remark ?? ''
    ).trim() || null;

  return payload;
};

const LeadStatusUpdateModal = ({
  isOpen,
  lead,
  onClose,
  onUpdateSuccess,
  isUpdating: externalUpdating = false,
  campaignId,
  authToken,

  apiUrl = 'https://crm-backend-5-iocr.onrender.com/api',
}) => {
  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState('success');

  const [form, setForm] =
    useState(INITIAL_FORM);

  const [
    internalUpdating,
    setInternalUpdating,
  ] = useState(false);

  const isUpdating =
    externalUpdating ||
    internalUpdating;

  const selectedOption = useMemo(
    () =>
      STATUS_OPTIONS.find(
        (option) =>
          option.value === selectedStatus
      ) || STATUS_OPTIONS[0],
    [selectedStatus]
  );

  const name = useMemo(
    () =>
      getLeadValue(
        lead,
        LEAD_FIELD_MAP.customerName
      ),
    [lead]
  );

  const dynamicFields =
    STATUS_FIELDS[selectedStatus] || [];

  useEffect(() => {
    if (!isOpen || !lead) {
      return;
    }

    const currentStatus =
      normalizeStatus(
        getLeadValue(lead, [
          'status',
          'leadStatus',
          'state',
          'lead_state',
        ])
      );

    setSelectedStatus(
      STATUS_OPTIONS.some(
        (option) =>
          option.value === currentStatus
      )
        ? currentStatus
        : 'success'
    );

    setForm({
      ...getInitialForm(lead),
      product: getCampaignName(lead),
    });
  }, [lead, isOpen]);

  const updateField = (
    field,
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleStatusChange = (
    status
  ) => {
    setSelectedStatus(status);

    setForm((previous) => ({
      ...previous,
      reason:
        status === 'rejected' ||
        status === 'notConnected'
          ? previous.reason
          : '',

      holdDate:
        status === 'hold'
          ? previous.holdDate
          : '',
    }));
  };


  const handleClose = () => {
    if (isUpdating) {
      return;
    }

    onClose?.();
  };
  const handleSubmit =
    async () => {
      const validationError =
        validateForm(
          selectedStatus,
          form
        );

      if (validationError) {
        toast.error(validationError);
        return;
      }

      if (!lead) {
        toast.error('Lead information is missing.');
        return;
      }

      const leadId =
        getLeadId(lead);

      if (!leadId) {
        toast.error('Unable to determine lead id.');
        return;
      }

      const finalCampaignId =
        campaignId ||
        getCampaignId(lead);

      if (!finalCampaignId) {
        toast.error('Unable to determine campaign id.');
        return;
      }

      const token =
        getToken(authToken);

      if (!token) {
        toast.error(
          'Authentication token is missing.'
        );
        return;
      }

      const baseUrl =
        String(apiUrl || '').replace(/\/$/,'');

      const payload =
        buildPayload(
          lead,
          form,
          selectedOption
        );

      const url =`${baseUrl}/campaigns/${finalCampaignId}/leads/${leadId}`;

      try {
        setInternalUpdating(
          true
        );

        const response =
          await axios.patch(
            url,
            payload,
            {
              headers: {
                'Content-Type':
                  'application/json',
                Authorization:
                  `Bearer ${token}`,
              },
              timeout: 20000,
            }
          );

        const data = response?.data || {};
        onUpdateSuccess?.(data);
        toast.success('Lead updated successfully');
        onClose?.();
      } catch (error) {
        const message = error?.response?.data?.message || error?.response?.data?.error || 'Unable to update lead.';
        toast.error(message);
      } finally {
        setInternalUpdating(
          false
        );
      }
    };

  if (!lead) {
    return null;
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      size="xl"
      isLoading={isUpdating}
    >
      <div className="flex max-h-[88vh] flex-col overflow-hidden bg-white">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600 text-sm font-bold text-white shadow-sm">
              {getInitials(name)}
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {name || 'Lead'}
              </h2>

              <p className="mt-0.5 text-xs text-gray-400">
                Lead ID: #
                {formatLeadId(lead)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isUpdating}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-xl leading-none text-gray-400 transition hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="border-b border-gray-100 px-5 pt-3 sm:px-6">
          <div className="inline-flex border-b-2 border-indigo-500 pb-3">
            <span className="text-sm font-semibold text-indigo-600">
              ✎&nbsp; Update Lead
            </span>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          <div>
            <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Select Status
            </p>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {STATUS_OPTIONS.map(
                (option) => {
                  const selected =
                    selectedStatus ===
                    option.value;

                  return (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      disabled={
                        isUpdating
                      }
                      onClick={() =>
                        handleStatusChange(
                          option.value
                        )
                      }
                      className={`
                        group rounded-xl border p-3 text-center
                        transition-all duration-200
                        ${
                          selected
                            ? 'border-indigo-500 bg-indigo-50 shadow-sm ring-2 ring-indigo-100'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }
                        disabled:cursor-not-allowed disabled:opacity-60
                      `}
                    >
                      <div className="flex flex-col items-center">
                        <span
                          className={`
                            mb-1 flex h-7 w-7 items-center justify-center
                            text-xl font-bold
                            ${option.iconClass}
                          `}
                        >
                          {option.icon}
                        </span>

                        <span className="text-xs font-semibold text-gray-700">
                          {option.label}
                        </span>

                        <span className="mt-1 hidden text-[10px] leading-4 text-gray-400 sm:block">
                          {
                            option.description
                          }
                        </span>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 sm:p-5">
            <div className="mb-5 flex items-center gap-3">
              <div
                className={`
                  flex h-9 w-9 items-center justify-center rounded-lg
                  ${
                    selectedStatus ===
                    'success'
                      ? 'bg-emerald-100 text-emerald-600'
                      : selectedStatus ===
                          'rejected'
                        ? 'bg-rose-100 text-rose-600'
                        : selectedStatus ===
                            'hold'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-slate-200 text-slate-600'
                  }
                `}
              >
                {selectedOption.icon}
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-800">
                  {
                    selectedOption.label
                  }
                </h3>

                <p className="text-xs text-gray-400">
                  {
                    selectedOption.description
                  }
                </p>
              </div>
            </div>

            {dynamicFields.length >
              0 && (
              <div>
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700">
                    {getStatusSectionTitle(
                      selectedStatus
                    )}
                  </h4>

                  <p className="mt-1 text-xs text-gray-400">
                    {getStatusSectionDescription(
                      selectedStatus
                    )}
                  </p>
                </div>

                <DynamicFields
                  fields={
                    dynamicFields
                  }
                  form={form}
                  onChange={
                    updateField
                  }
                  disabled={
                    isUpdating
                  }
                />
              </div>
            )}

            {selectedStatus ===
              'hold' && (
              <div className="mt-4">
                <ReadOnlyField
                  label="Customer"
                  value={name}
                />
              </div>
            )}

            <div className="mt-5 border-t border-gray-200 pt-5">
              <FormTextarea
                label="Remark"
                value={form.remark}
                onChange={(value) =>
                  updateField(
                    'remark',
                    value
                  )
                }
                required
                placeholder="Enter remark..."
                disabled={
                  isUpdating
                }
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-xs text-gray-400">
            <span className="font-medium text-gray-500">
              Selected:
            </span>{' '}
            {
              selectedOption.label
            }
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={handleClose} disabled={isUpdating}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={
                handleSubmit
              }
              disabled={
                isUpdating
              }
              className="rounded-xl bg-[#83b9bd] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6fa9ae] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpdating ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Updating...
                </span>
              ) : (
                '✓ Update Lead'
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const DynamicFields = ({
  fields,
  form,
  onChange,
  disabled,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {fields.map((field) => {
        const commonProps = {
          key: field.name,
          label: field.label,
          value: form[field.name],
          onChange: (value) =>
            onChange(
              field.name,
              value
            ),
          required:
            field.required,
          placeholder:
            field.placeholder,
          readOnly: field.readOnly,
          disabled,
        };
        if (
          field.type === 'select'
        ) {
          return (
            <FormSelect
              {...commonProps}
              options={field.options || []}
          />
        );
        }

        if (
          field.type ===
          'textarea'
        ) {
          return (
            <div
              key={field.name}
              className={
                field.fullWidth
                  ? 'md:col-span-2'
                  : ''
              }
            >
              <FormTextarea
                {...commonProps}
                rows={
                  field.rows ||
                  3
                }
              />
            </div>
          );
        }
        return (
          <FormField
            {...commonProps}
            type={
              field.type ||
              'text'
            }
            min={
              field.minToday
                ? getToday()
                : undefined
            }
          />
        );
      })}
    </div>
  );
};
const FormSelect = ({
  label,
  value,
  onChange,
  required = false,
  placeholder = 'Select an option',
  disabled = false,
  options = [],
}) => {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-600">
        {label}

        {required && (
          <span className="ml-1 text-rose-500">
            *
          </span>
        )}
      </label>

      <select
        value={value ?? ''}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        disabled={disabled}
        className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
      >
        <option value="">
          {placeholder}
        </option>

        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {option.label}
            </option>
          )
        )}
      </select>
    </div>
  );
};

const getStatusSectionTitle = (
  status
) => {
  const titles = {
    success:
      'Customer Information',
    hold: 'Follow-up Details',
    rejected:
      'Rejection Details',
    notConnected:
      'Contact Details',
  };

  return (
    titles[status] ||
    'Status Details'
  );
};

const getStatusSectionDescription = (
  status
) => {
  const descriptions = {
    success:
      'Confirm the customer details before marking this lead as complete.',

    hold:
      'Select when you want to follow up with this customer.',

    rejected:
      'Please provide a reason for rejecting this lead.',

    notConnected:
      'Tell us why the customer could not be connected.',
  };

  return (
    descriptions[status] ||
    'Provide the required information for this status.'
  );
};
const FormField = ({
  label,
  value,
  onChange,
  required = false,
  placeholder = '',
  disabled = false,
  readOnly = false,
  type = 'text',
  min,
}) => {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-600">
        {label}

        {required && (
          <span className="ml-1 text-rose-500">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        value={value ?? ''}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        min={min}
        disabled={disabled}
        readOnly={readOnly}
        className="input-field h-10 !rounded-xl !bg-white !px-3 !py-2 text-sm !text-gray-700 placeholder:!text-gray-300 read-only:!cursor-default read-only:!bg-gray-100 focus:!border-indigo-400 focus:!ring-2 focus:!ring-indigo-100 disabled:!cursor-not-allowed disabled:!bg-gray-100 disabled:!text-gray-400"
      />
    </div>
  );
};

const FormTextarea = ({
  label,
  value,
  onChange,
  required = false,
  placeholder = '',
  disabled = false,
  readOnly = false,
  rows = 3,
}) => {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-600">
        {label}

        {required && (
          <span className="ml-1 text-rose-500">
            *
          </span>
        )}
      </label>

      <textarea
        value={value ?? ''}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        rows={rows}
        disabled={disabled}
        readOnly={readOnly}
        className="input-field resize-none !rounded-xl !bg-white !px-3 !py-2.5 text-sm !text-gray-700 placeholder:!text-gray-300 read-only:!cursor-default read-only:!bg-gray-100 focus:!border-indigo-400 focus:!ring-2 focus:!ring-indigo-100 disabled:!cursor-not-allowed disabled:!bg-gray-100 disabled:!text-gray-400"
      />
    </div>
  );
};

const ReadOnlyField = ({
  label,
  value,
}) => {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-500">
        {label}
      </label>

      <div className="flex h-10 items-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500">
        {value ||
          'Not provided'}
      </div>
    </div>
  );
};

export default LeadStatusUpdateModal;
