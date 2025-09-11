import VendorSubmissionPortal from '../../../components/VendorSubmissionPortal';

export default function VendorPortalPage({ params }: { params: { unique_link: string } }) {
  const uniqueLink = params.unique_link;
  return <VendorSubmissionPortal uniqueLink={uniqueLink} />;
}


