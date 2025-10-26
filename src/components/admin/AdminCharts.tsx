// src/components/admin/AdminCharts.tsx
'use client'

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, LineChart, Line, BarChart, Bar, CartesianGrid,
} from 'recharts'

type Point = { label: string; value: number }
export default function AdminCharts({
  usersDaily, revenueDaily, clubsSplit,
}: {
  usersDaily: Point[]
  revenueDaily: Point[]
  clubsSplit: { active: number; total: number }
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Günlük yeni üye */}
      <div className="rounded-2xl bg-white ring-1 ring-black/5 p-4">
        <div className="mb-3 text-sm text-gray-600">Günlük yeni üye (30 gün)</div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={usersDaily}>
              <defs>
                <linearGradient id="u" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopOpacity={0.35}/>
                  <stop offset="100%" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="currentColor" fill="url(#u)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Günlük ciro */}
      <div className="rounded-2xl bg-white ring-1 ring-black/5 p-4">
        <div className="mb-3 text-sm text-gray-600">Günlük ciro (₺, 30 gün)</div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueDaily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Kulüp durumu */}
      <div className="rounded-2xl bg-white ring-1 ring-black/5 p-4">
        <div className="mb-3 text-sm text-gray-600">Kulüp durumu</div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={[
                { label: 'Aktif', value: clubsSplit.active },
                { label: 'Toplam', value: clubsSplit.total },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
