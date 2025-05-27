// 📁 src/utils/chartOptions.ts

import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// 🔥 تسجيل Scales والمكونات المطلوبة
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// 🎨 خيارات الرسم البياني الافتراضية
export const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
  },
};
