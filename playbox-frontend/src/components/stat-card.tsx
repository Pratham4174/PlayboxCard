
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  description?: string;
}

export function StatCard({ title, value, icon, color, description }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className={`p-4 border rounded-lg ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium opacity-80">{title}</h3>
        <div className={`p-1.5 rounded-md ${colorClasses[color]} bg-opacity-50`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <p className="text-xs mt-1 opacity-70">{description}</p>
      )}
    </div>
  );
}