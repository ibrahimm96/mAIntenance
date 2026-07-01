export type User = { id: number; name: string; email: string };

export type Vehicle = {
  id: number;
  nickname?: string | null;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  engine?: string | null;
  current_mileage: number;
  monthly_mileage: number;
};

export type ServiceRecord = {
  id: number;
  service_type: string;
  service_date: string;
  service_mileage: number;
  cost: number;
  notes?: string | null;
};

export type ForecastItem = {
  id?: number;
  source: 'rule';
  service_type: string;
  display_name: string;
  status: string;
  due_date?: string;
  due_mileage?: number;
  estimated_min_cost: number;
  estimated_max_cost: number;
  message?: string;
};

export type TimelineMonth = {
  month: string;
  label: string;
  services: string[];
  min_cost: number;
  max_cost: number;
  predicted_mileage: number;
};

export type Forecast = {
  vehicle: Vehicle;
  items: ForecastItem[];
  timeline: TimelineMonth[];
  next_service: ForecastItem | null;
  overdue_count: number;
  twelve_month_min: number;
  twelve_month_max: number;
  most_expensive_month: TimelineMonth | null;
};
