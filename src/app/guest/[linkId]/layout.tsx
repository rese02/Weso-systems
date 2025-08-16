
import { getBookingLinkDetails } from '@/lib/actions/booking.actions';
import type { Metadata } from 'next';

type Props = {
  params: { linkId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const linkId = params.linkId;
  const result = await getBookingLinkDetails(linkId);

  if (result.success && result.data) {
    const hotelName = result.data.hotelName;
    const hotelLogo = result.data.prefill.logoUrl;

    return {
      title: `${hotelName} - Buchung`,
      icons: {
        icon: hotelLogo || '/favicon.ico',
      },
    };
  }

  // Fallback metadata
  return {
    title: 'Buchung',
  };
}


export default function GuestBookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

    