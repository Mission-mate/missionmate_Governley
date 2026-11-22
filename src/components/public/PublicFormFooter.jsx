import React from 'react';
import { Facebook, Instagram, Linkedin, Globe } from 'lucide-react';

const SOCIALS = [
{ key: 'facebook', label: 'Facebook', Icon: Facebook },
{ key: 'instagram', label: 'Instagram', Icon: Instagram },
{ key: 'linkedin', label: 'LinkedIn', Icon: Linkedin },
{ key: 'website', label: 'Website', Icon: Globe }];


/**
 * Public membership page footer:
 * - contact line when a support email is configured
 * - social handles when any are configured
 * - "Powered by Missionmate" credit
 */
export default function PublicFormFooter({ supportEmail, socialLinks = {} }) {
  const links = SOCIALS.filter((s) => (socialLinks?.[s.key] || '').trim());

  return (
    <footer className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-10 text-center space-y-6">
      {supportEmail &&
      <p className="text-sm text-muted-foreground">
          Contact{' '}
          <a href={`mailto:${supportEmail}`} className="text-primary font-medium hover:underline">
            {supportEmail}
          </a>{' '}
          for membership enquiries.
        </p>
      }

      {links.length > 0 &&
      <div>
          <p className="text-sm font-semibold text-foreground mb-3">Follow us on socials</p>
          <div className="flex items-center justify-center gap-3">
            {links.map(({ key, label, Icon }) =>
          <a
            key={key}
            href={socialLinks[key]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">
            
                <Icon className="w-5 h-5" />
              </a>
          )}
          </div>
        </div>
      }

      
    </footer>);

}