import { notFound } from 'next/navigation';
import NativeFacultyInsightsPreview from './preview-client';

export default function NativeFacultyInsightsDevPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <NativeFacultyInsightsPreview />;
}
