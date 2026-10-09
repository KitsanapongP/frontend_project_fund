import { notFound } from 'next/navigation';
import Preview from './preview-client';
export default function TooltipResearchPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <Preview/>;
}
