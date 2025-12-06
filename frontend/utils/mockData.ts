import { Email } from '../types';

const SENDERS = [
  { name: 'Uber Receipts', email: 'uber.us@uber.com', category: 'updates' },
  { name: 'Netflix', email: 'info@mailer.netflix.com', category: 'promotions' },
  { name: 'LinkedIn', email: 'messages-noreply@linkedin.com', category: 'social' },
  { name: 'GitHub', email: 'noreply@github.com', category: 'updates' },
  { name: 'Amazon.com', email: 'shipment-tracking@amazon.com', category: 'updates' },
  { name: 'Newsletter Weekly', email: 'hello@newsletter.com', category: 'promotions' },
  { name: 'Sarah Jenkins', email: 'sarah.j@work.com', category: 'primary' },
  { name: 'Recruiter', email: 'talent@hiring.com', category: 'primary' },
  { name: 'Google Cloud', email: 'cloud-billing-noreply@google.com', category: 'updates' },
  { name: 'Atlassian Jira', email: 'jira@atlassian.net', category: 'updates' },
  // Added "Clutter" for Primary category
  { name: 'Service Updates', email: 'no-reply@service.com', category: 'primary' },
  { name: 'Webinar Bot', email: 'bot@webinar-hosting.com', category: 'primary' },
  { name: 'Community Digest', email: 'digest@community-forum.com', category: 'primary' },
];

const SUBJECTS = {
  'updates': ['Your receipt for Tuesday', 'Your package has shipped', '[JIRA] Issue assigned to you', 'Billing Statement available', 'Security Alert'],
  'promotions': ['Watch this now!', '50% off everything', 'Recommended for you', 'Last chance to buy', 'New arrivals just for you'],
  'social': ['You appeared in 5 searches', 'New connection request', 'Happy Birthday!', 'Trending in your network', 'Job alert: Senior Engineer'],
  'primary': [
    // Important stuff
    'Project sync tomorrow?', 'Meeting notes', 'Can we reschedule?', 'Lunch on Friday', 'Quarterly Review',
    // Clutter/Non-important stuff that often lands in Primary
    'Updates to our Terms of Service', 'You are registered for the webinar', 'Community Weekly Digest', 'Login attempt detected', 'Please rate your recent support experience'
  ]
};

export const generateMockEmails = (count: number): Email[] => {
  const emails: Email[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const senderObj = SENDERS[Math.floor(Math.random() * SENDERS.length)];
    const category = senderObj.category as any;
    const possibleSubjects = SUBJECTS[category as keyof typeof SUBJECTS] || ['No Subject'];
    const subject = possibleSubjects[Math.floor(Math.random() * possibleSubjects.length)];
    
    // Random date within last 60 days
    const date = new Date(now.getTime() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000));
    
    // Determine importance based on subject for Primary (simulate real world where Terms of Service isn't "Important")
    let isImportant = false;
    if (category === 'primary') {
        const clutterSubjects = ['Terms of Service', 'registered', 'Digest', 'rate your'];
        const isClutter = clutterSubjects.some(s => subject.includes(s));
        isImportant = !isClutter && Math.random() > 0.3;
    }

    emails.push({
      id: `email-${i}-${Math.random().toString(36).substr(2, 9)}`,
      sender: senderObj.name,
      senderEmail: senderObj.email,
      subject: subject,
      snippet: `This is a preview of the email content for ${subject}. It contains some text that might be relevant to your search...`,
      date: date,
      isRead: Math.random() > 0.3,
      isImportant: isImportant,
      isSpam: false,
      isTrash: false,
      category: category,
      labels: []
    });
  }

  return emails.sort((a, b) => b.date.getTime() - a.date.getTime());
};