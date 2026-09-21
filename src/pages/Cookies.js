import LegalDocument from '../components/LegalDocument'

const COOKIE_CONTENT = `**CHIRON**

COOKIE POLICY

www.chironevo.com

Effective date: 18/09/2026

# **1. PURPOSE OF THIS POLICY**

1.1 This policy explains which cookies and similar technologies are used
on www.chironevo.com (the "Platform"), what they do, and how you can
control them.

1.2 The Platform is operated by Evangelos A. Koumasopoulos, Athens,
Greece. Contact: legal@chironevo.com.

1.3 This policy should be read together with the Privacy Policy, which
explains more generally how personal data is handled.

# **2. WHAT COOKIES ARE**

2.1 A cookie is a small text file placed on your device by a website and
read back on later visits. Cookies allow a site to recognise a device,
for example so that you remain logged in as you move between pages.

2.2 This policy applies equally to technologies that work in a
comparable way, including local storage, session storage, pixels and
device fingerprinting, whether or not they are technically cookies.

2.3 A cookie set by the site you are visiting is a first party cookie.
One set by another domain is a third party cookie. A session cookie is
deleted when you close your browser. A persistent cookie remains for a
defined period.

# **3. LEGAL FRAMEWORK**

This policy is issued under:

- Regulation (EU) 2016/679 (General Data Protection Regulation) and Law
  4624/2019;

- Directive 2002/58/EC, as transposed by Law 3471/2006 and in particular
  Article 4(5) of that Law, as amended by Law 4070/2012;

- the guidance issued by the Hellenic Data Protection Authority on
  cookies and other trackers.

Under Article 4(5) of Law 3471/2006, storing information on, or gaining
access to information stored on, a user's device requires that user's
prior consent, unless the sole purpose is to carry out the transmission
of a communication or is strictly necessary to provide a service which
the user has expressly requested.

# **4. WHAT THE PLATFORM CURRENTLY USES**

4.1 The Platform uses strictly necessary cookies only. These are
required to keep you logged in, to maintain your session and to protect
the security of the Platform. Without them the Platform cannot function
and you cannot use your account.

4.2 The Platform does not use analytics cookies, advertising cookies,
profiling cookies, social media plug-ins or any third party tracking
technology.

4.3 Because the cookies in use are strictly necessary within the meaning
of Article 4(5) of Law 3471/2006, your consent is not required for them,
and none can be refused without disabling the Platform. No consent
banner is therefore displayed. This information is provided so that you
know what is being stored on your device.

4.4 The technology used for this purpose is implemented via browser
local storage rather than a traditional cookie. It is functionally
equivalent — it identifies your device so that you remain logged in —
and is treated the same way under this policy, in accordance with clause
2.2.

4.5 If cookies of any other category are introduced in the future,
clause 6 will apply and this policy will be updated beforehand.

# **5. THE COOKIES IN USE**

Strictly necessary cookies:

| **Name**                            | **Provider or domain**                                                       | **Purpose**                                                                           | **Duration**                                                                     | **Type**      |
|-------------------------------------|------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|----------------------------------------------------------------------------------|---------------|
| sb-<project-reference>-auth-token | chironevo.com (first party; issued by Supabase, our authentication provider) | Keeps you signed in and maintains your authenticated session while using your account | Refreshes automatically approximately every hour while active; cleared on logout | Local storage |

*The technical details in this table are to be completed and kept
current by the person maintaining the Platform. Where a cookie ceases to
be used, the corresponding row is deleted.*

# **6. IF NON-ESSENTIAL COOKIES ARE INTRODUCED**

The following rules will apply from the moment any cookie other than a
strictly necessary one is used on the Platform.

6.1 On your first visit you will be shown a notice setting out the
categories of cookies proposed, with an explanation of each.

6.2 Consent will be obtained by an affirmative act, separately for each
category. Continuing to browse, scrolling the page, closing the notice
or doing nothing at all will not amount to consent, in accordance with
Article 7 GDPR.

6.3 Refusing will be as easy as accepting, and both options will be
presented with equal prominence.

6.4 No non-essential cookie will be placed on your device before you
have made your choice.

6.5 You will be able to withdraw or change your consent at any time,
through a link accessible from every page. Withdrawal will not affect
the lawfulness of anything done beforehand.

6.6 A record of your choice will be kept as proof of consent, and you
will be asked again at intervals of no more than twelve months.

# **7. CONTROLLING COOKIES THROUGH YOUR BROWSER**

7.1 Every current browser allows you to see which cookies are stored, to
delete them, and to block them in advance. The relevant setting is
usually found under Privacy or Site settings, and the browser's own help
pages give step by step instructions.

7.2 Browsers also offer a private or incognito mode, in which cookies
are discarded when the window is closed.

7.3 Blocking or deleting the strictly necessary cookies described in
clause 4 will log you out and will prevent you from using your account.
This is a consequence of how the Platform works and not a fault.

# **8. CHANGES TO THIS POLICY**

8.1 This policy will be updated whenever the cookies in use change. The
version number and effective date at the head of the document always
reflect the current text.

8.2 Where a change involves the introduction of non-essential cookies,
consent will be sought before those cookies are placed.

# **9. CONTACT AND COMPLAINTS**

Questions about this policy: legal@chironevo.com

You may lodge a complaint with the supervisory authority:

Hellenic Data Protection Authority

1-3 Kifissias Avenue, 115 23 Athens, Greece

Telephone: +30 210 6475600

Email: contact@dpa.gr

Website: www.dpa.gr
`

export default function Cookies() {
  return <LegalDocument title="Cookie Policy" content={COOKIE_CONTENT} />
}
