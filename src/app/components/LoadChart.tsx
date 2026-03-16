import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState, useRef } from 'react';

interface LoadChartProps {
  currentLoad: number;
  capacity: number;
}

interface DataPoint {
  timestamp: number;
  time: string;
  load: number;
  capacity: number;
}

export function LoadChart({ currentLoad, capacity }: LoadChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const lastUpdate = useRef<{ load: number; capacity: number } | null>(null);

  useEffect(() => {
    // Skip if values haven't changed
    if (
      lastUpdate.current &&
      lastUpdate.current.load === currentLoad &&
      lastUpdate.current.capacity === capacity
    ) {
      return;
    }

    lastUpdate.current = { load: currentLoad, capacity };

    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    const timestamp = now.getTime();

    setData((prev) => {
      const newData = [
        ...prev,
        {
          timestamp,
          time: timeStr,
          load: currentLoad,
          capacity: capacity * 1000, // Convert kW to W
        },
      ];

      // Keep only last 20 data points
      return newData.slice(-20);
    });
  }, [currentLoad, capacity]);

  // Don't render chart if no data
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Site Load Over Time</h2>
        <div className="h-[300px] flex items-center justify-center text-gray-400">
          Waiting for data...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h2 className="font-semibold text-gray-900 mb-4">Site Load Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickMargin={8}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickMargin={8}
            label={{ value: 'Power (W)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="load"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Current Load"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="capacity"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Capacity"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}