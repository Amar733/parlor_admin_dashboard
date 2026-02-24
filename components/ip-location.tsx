import { useIpLocation } from '@/hooks/use-ip-location';
import { MapPin } from 'lucide-react';

interface IpLocationProps {
  ip: string;
}

export function IpLocation({ ip }: IpLocationProps) {
  const { getLocation } = useIpLocation();
  
  if (!ip) return null;
  
  const location = getLocation(ip);

  return (
    <div className="flex items-center gap-1 text-xs">
      <MapPin className="h-3 w-3 text-muted-foreground" />
      <div className="flex flex-col">
        <span className="font-mono text-muted-foreground">{ip}</span>
        {location && (
          <span className="text-foreground">
            {location.city}, {location.region}, {location.country_name}
          </span>
        )}
      </div>
    </div>
  );
}