import VendorSubmissionPortal from '../../../components/VendorSubmissionPortal';

interface PageProps {
  params: { unique_link: string };
}

export default function VendorPortalPage({ params }: PageProps) {
  const uniqueLink = params.unique_link;
  return <VendorSubmissionPortal uniqueLink={uniqueLink} />;
}


