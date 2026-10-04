import { notFound } from 'next/navigation';
import FacultyInsightsPreview from './preview-client';

export default function FacultyInsightsDevPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <FacultyInsightsPreview />;
}
