import React, { useState } from 'react'

const staticData = [
  {
    id: "camp1",
    date: "2026-07-30",
    title: "#1 - EAR fresh",
    campaignId: "vLCNM9zH2HBZC1p1aXOMmTbdbBkSTs4M",
    managers: [
      {
        name: "Manager: Azad TI",
        total: 96,
        tls: [
          {
            name: "Azad - TL1",
            total: 32,
            tcs: [
              { name: "Azad - TC1", total: 16 },
              { name: "Azad - TC2", total: 16 },
            ],
          },
          {
            name: "Azad - TL2",
            total: 32,
            tcs: [
              { name: "Azad - TC3", total: 17 },
              { name: "Azad - TC4", total: 15 },
            ],
          },
          {
            name: "Azad - TL3",
            total: 32,
            tcs: [
              { name: "Azad - TC5", total: 18 },
              { name: "Azad - TC6", total: 14 },
            ],
          },
        ],
      },
    ],
  },

  {
    id: "camp2",
    date: "2026-07-30",
    title: "#2 - Gathheal fresh",
    campaignId: "09Mf5UJiRDgwnBfK7c3pm48QTi7cJvWXj",
    managers: [
      {
        name: "Manager: Ashu Hussain",
        total: 120,
        tls: [
          {
            name: "Ashu - TL1",
            total: 40,
            tcs: [
              { name: "Ashu - TC1", total: 20 },
              { name: "Ashu - TC2", total: 20 },
            ],
          },
          {
            name: "Ashu - TL2",
            total: 40,
            tcs: [
              { name: "Ashu - TC3", total: 22 },
              { name: "Ashu - TC4", total: 18 },
            ],
          },
          {
            name: "Ashu - TL3",
            total: 40,
            tcs: [
              { name: "Ashu - TC5", total: 21 },
              { name: "Ashu - TC6", total: 19 },
            ],
          },
        ],
      },
    ],
  },

  {
    id: "camp3",
    date: "2026-07-31",
    title: "#3 - Diabetes fresh",
    campaignId: "campaign_diabetes_001",
    managers: [
      {
        name: "Manager: Rahul Sharma",
        total: 135,
        tls: [
          {
            name: "Rahul - TL1",
            total: 45,
            tcs: [
              { name: "Rahul - TC1", total: 23 },
              { name: "Rahul - TC2", total: 22 },
            ],
          },
          {
            name: "Rahul - TL2",
            total: 45,
            tcs: [
              { name: "Rahul - TC3", total: 24 },
              { name: "Rahul - TC4", total: 21 },
            ],
          },
          {
            name: "Rahul - TL3",
            total: 45,
            tcs: [
              { name: "Rahul - TC5", total: 20 },
              { name: "Rahul - TC6", total: 25 },
            ],
          },
        ],
      },
    ],
  },

  {
    id: "camp4",
    date: "2026-07-31",
    title: "#4 - BP fresh",
    campaignId: "campaign_bp_002",
    managers: [
      {
        name: "Manager: Vikash Kumar",
        total: 150,
        tls: [
          {
            name: "Vikash - TL1",
            total: 50,
            tcs: [
              { name: "Vikash - TC1", total: 25 },
              { name: "Vikash - TC2", total: 25 },
            ],
          },
          {
            name: "Vikash - TL2",
            total: 50,
            tcs: [
              { name: "Vikash - TC3", total: 27 },
              { name: "Vikash - TC4", total: 23 },
            ],
          },
          {
            name: "Vikash - TL3",
            total: 50,
            tcs: [
              { name: "Vikash - TC5", total: 26 },
              { name: "Vikash - TC6", total: 24 },
            ],
          },
        ],
      },
    ],
  },

  {
    id: "camp5",
    date: "2026-08-01",
    title: "#5 - Heart Care fresh",
    campaignId: "campaign_heart_003",
    managers: [
      {
        name: "Manager: Sandeep Singh",
        total: 126,
        tls: [
          {
            name: "Sandeep - TL1",
            total: 42,
            tcs: [
              { name: "Sandeep - TC1", total: 21 },
              { name: "Sandeep - TC2", total: 21 },
            ],
          },
          {
            name: "Sandeep - TL2",
            total: 42,
            tcs: [
              { name: "Sandeep - TC3", total: 20 },
              { name: "Sandeep - TC4", total: 22 },
            ],
          },
          {
            name: "Sandeep - TL3",
            total: 42,
            tcs: [
              { name: "Sandeep - TC5", total: 23 },
              { name: "Sandeep - TC6", total: 19 },
            ],
          },
        ],
      },
    ],
  },

  {
    id: "camp6",
    date: "2026-08-01",
    title: "#6 - Skin Care fresh",
    campaignId: "campaign_skin_004",
    managers: [
      {
        name: "Manager: Amit Verma",
        total: 144,
        tls: [
          {
            name: "Amit - TL1",
            total: 48,
            tcs: [
              { name: "Amit - TC1", total: 24 },
              { name: "Amit - TC2", total: 24 },
            ],
          },
          {
            name: "Amit - TL2",
            total: 48,
            tcs: [
              { name: "Amit - TC3", total: 26 },
              { name: "Amit - TC4", total: 22 },
            ],
          },
          {
            name: "Amit - TL3",
            total: 48,
            tcs: [
              { name: "Amit - TC5", total: 25 },
              { name: "Amit - TC6", total: 23 },
            ],
          },
        ],
      },
    ],
  },

  {
    id: "camp7",
    date: "2026-08-02",
    title: "#7 - Joint Care fresh",
    campaignId: "campaign_joint_005",
    managers: [
      {
        name: "Manager: Rohit Yadav",
        total: 132,
        tls: [
          {
            name: "Rohit - TL1",
            total: 44,
            tcs: [
              { name: "Rohit - TC1", total: 22 },
              { name: "Rohit - TC2", total: 22 },
            ],
          },
          {
            name: "Rohit - TL2",
            total: 44,
            tcs: [
              { name: "Rohit - TC3", total: 23 },
              { name: "Rohit - TC4", total: 21 },
            ],
          },
          {
            name: "Rohit - TL3",
            total: 44,
            tcs: [
              { name: "Rohit - TC5", total: 20 },
              { name: "Rohit - TC6", total: 24 },
            ],
          },
        ],
      },
    ],
  },

  {
    id: "camp8",
    date: "2026-08-02",
    title: "#8 - Pain Relief fresh",
    campaignId: "campaign_pain_006",
    managers: [
      {
        name: "Manager: Mohit Singh",
        total: 150,
        tls: [
          {
            name: "Mohit - TL1",
            total: 50,
            tcs: [
              { name: "Mohit - TC1", total: 25 },
              { name: "Mohit - TC2", total: 25 },
            ],
          },
          {
            name: "Mohit - TL2",
            total: 50,
            tcs: [
              { name: "Mohit - TC3", total: 28 },
              { name: "Mohit - TC4", total: 22 },
            ],
          },
          {
            name: "Mohit - TL3",
            total: 50,
            tcs: [
              { name: "Mohit - TC5", total: 24 },
              { name: "Mohit - TC6", total: 26 },
            ],
          },
        ],
      },
    ],
  },

  {
    id: "camp9",
    date: "2026-08-03",
    title: "#9 - Cold & Cough fresh",
    campaignId: "campaign_cold_007",
    managers: [
      {
        name: "Manager: Naveen Kumar",
        total: 138,
        tls: [
          {
            name: "Naveen - TL1",
            total: 46,
            tcs: [
              { name: "Naveen - TC1", total: 23 },
              { name: "Naveen - TC2", total: 23 },
            ],
          },
          {
            name: "Naveen - TL2",
            total: 46,
            tcs: [
              { name: "Naveen - TC3", total: 25 },
              { name: "Naveen - TC4", total: 21 },
            ],
          },
          {
            name: "Naveen - TL3",
            total: 46,
            tcs: [
              { name: "Naveen - TC5", total: 22 },
              { name: "Naveen - TC6", total: 24 },
            ],
          },
        ],
      },
    ],
  },

  {
    id: "camp10",
    date: "2026-08-03",
    title: "#10 - General Medicine fresh",
    campaignId: "campaign_general_008",
    managers: [
      {
        name: "Manager: Deepak Kumar",
        total: 156,
        tls: [
          {
            name: "Deepak - TL1",
            total: 52,
            tcs: [
              { name: "Deepak - TC1", total: 26 },
              { name: "Deepak - TC2", total: 26 },
            ],
          },
          {
            name: "Deepak - TL2",
            total: 52,
            tcs: [
              { name: "Deepak - TC3", total: 27 },
              { name: "Deepak - TC4", total: 25 },
            ],
          },
          {
            name: "Deepak - TL3",
            total: 52,
            tcs: [
              { name: "Deepak - TC5", total: 28 },
              { name: "Deepak - TC6", total: 24 },
            ],
          },
        ],
      },
    ],
  },
];

const Report = () => {
  const [data] = useState(staticData)
  const [openCampaign, setOpenCampaign] = useState(null)
  const [openManager, setOpenManager] = useState(null)
  const [openTl, setOpenTl] = useState(null)

  const toggleCampaign = (id) => {
    setOpenTl(null)
    setOpenManager(null)
    setOpenCampaign((prev) => (prev === id ? null : id))
  }

  const toggleManager = (campId, managerIndex) => {
    const key = `${campId}::${managerIndex}`
    setOpenTl(null)
    setOpenManager((prev) => (prev === key ? null : key))
  }

  const toggleTl = (campId, managerIndex, tlIndex) => {
    const key = `${campId}::${managerIndex}::${tlIndex}`
    setOpenTl((prev) => (prev === key ? null : key))
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold mb-6">Report Summary</h1>

      <div className="space-y-4">
        {data.map((camp) => {
          const isCampOpen = openCampaign === camp.id
          return (
            <div key={camp.id} className="bg-white rounded shadow overflow-hidden">
              <button
                className="w-full text-left p-4 flex items-center justify-between bg-gradient-to-r from-teal-600 to-emerald-600 text-white"
                onClick={() => toggleCampaign(camp.id)}
                aria-expanded={isCampOpen}
              >
                <div>
                  <div className="text-xs bg-black/20 inline-block px-2 py-1 rounded mb-1">{camp.date}</div>
                  <div className="text-lg font-bold mt-1">{camp.title}</div>
                  <div className="text-sm opacity-80">Campaign ID: {camp.campaignId}</div>
                </div>
                <div className={`transform transition-transform duration-300 ${isCampOpen ? 'rotate-90' : ''}`}>
                  ▶
                </div>
              </button>

              <div className={`transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden ${isCampOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 bg-gray-50">
                  {camp.managers.map((man, mIndex) => {
                    const manKey = `${camp.id}::${mIndex}`
                    const isManOpen = openManager === manKey
                    return (
                      <div key={manKey} className="mb-3">
                        <div className="flex items-center justify-between">
                          <button
                            className="w-full text-left p-3 bg-white rounded shadow-sm flex items-center justify-between hover:shadow-md transition"
                            onClick={() => toggleManager(camp.id, mIndex)}
                          >
                            <div className="flex-1 text-md font-medium">{man.name}</div>
                            <div className="text-sm text-gray-600 mr-3">Total: {man.total}</div>
                            <div className={`transform transition-transform duration-300 ${isManOpen ? 'rotate-90' : ''}`}>▶</div>
                          </button>
                        </div>

                        <div className={`mt-2 transition-[max-height,opacity] duration-250 ease-in-out overflow-hidden ${isManOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
                          <div className="space-y-2">
                            {man.tls.map((tl, tlIndex) => {
                              const tlKey = `${camp.id}::${mIndex}::${tlIndex}`
                              const isTlOpen = openTl === tlKey
                              return (
                                <div key={tlKey}>
                                  <div className="flex items-center justify-between">
                                    <button
                                      className="w-full text-left p-3 bg-green-700 text-white rounded flex items-center justify-between hover:opacity-95 transition"
                                      onClick={() => toggleTl(camp.id, mIndex, tlIndex)}
                                    >
                                      <div className="font-semibold">{tl.name}</div>
                                      <div className="text-sm">Total: {tl.total}</div>
                                      <div className={`transform transition-transform duration-300 ${isTlOpen ? 'rotate-90' : ''}`}>▶</div>
                                    </button>
                                  </div>

                                  <div className={`pl-4 mt-2 transition-[max-height,opacity] duration-200 ease-in-out overflow-hidden ${isTlOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    {tl.tcs.map((tc) => (
                                      <div key={tc.name} className="bg-green-50 border-l-4 border-green-700 p-2 rounded mb-2 flex justify-between items-center">
                                        <div className="text-sm">{tc.name}</div>
                                        <div className="text-sm text-gray-700">{tc.total}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Report
