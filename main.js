// Mobile navigation toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  // Close menu when a nav link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
    });
  });
}

// Highlight active nav link on scroll
const sections = document.querySelectorAll('.section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');

function setActiveLink() {
  let currentId = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 80;
    if (window.scrollY >= sectionTop) {
      currentId = section.getAttribute('id');
    }
  });

  navAnchors.forEach(a => {
    a.style.color = '';
    if (a.getAttribute('href') === '#' + currentId) {
      a.style.color = 'var(--color-primary)';
    }
  });
}

window.addEventListener('scroll', setActiveLink, { passive: true });
setActiveLink();

// Render profile timeline data from lightweight text files.
const educationList = document.querySelector('[data-education-list]');
const experienceList = document.querySelector('[data-experience-list]');

const DATE_PATTERN = /^(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}|\d{4})(?:\s*[-–]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}|\d{4}|Present))?(?:\s*·\s*.+)?$/;

function isDateLine(line) {
  return DATE_PATTERN.test(line);
}

function isDurationLine(line) {
  return /^\d+\s+(?:yr|yrs|mo|mos)\b/.test(line);
}

function shouldSkipProfileLine(line) {
  return !line ||
    line === 'Experience' ||
    line.endsWith(' logo') ||
    line.startsWith('Thumbnail for ') ||
    line.startsWith('Group photo of ') ||
    line.startsWith('Skills:') ||
    line === 'Official website:';
}

function getProfileLines(text) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => !shouldSkipProfileLine(line));
}

function createTimelineItem(item) {
  const article = document.createElement('article');
  article.className = 'timeline-item';

  const date = createTextElement('div', 'timeline-date', item.date || '');
  const body = document.createElement('div');
  body.className = 'timeline-body';

  body.appendChild(createTextElement('h3', 'timeline-title', item.title));

  if (item.organization) {
    body.appendChild(createTextElement('p', 'timeline-org', item.organization));
  }

  if (item.type) {
    body.appendChild(createTextElement('p', 'timeline-type', item.type));
  }

  if (item.details?.length) {
    const description = document.createElement('div');
    description.className = 'timeline-description';

    item.details.forEach(detail => {
      const paragraph = document.createElement('p');

      if (/^https?:\/\//.test(detail)) {
        const link = document.createElement('a');
        link.href = detail;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = detail;
        paragraph.appendChild(link);
      } else {
        paragraph.textContent = detail;
      }

      description.appendChild(paragraph);
    });

    body.appendChild(description);
  }

  article.append(date, body);
  return article;
}

function renderTimeline(target, items, emptyMessage) {
  if (!target) {
    return;
  }

  target.textContent = '';

  if (!items.length) {
    target.appendChild(createTextElement('p', 'placeholder-text', emptyMessage));
    return;
  }

  items.forEach(item => target.appendChild(createTimelineItem(item)));
}

function parseEducation(text) {
  const lines = getProfileLines(text);
  const items = [];

  for (let index = 0; index < lines.length;) {
    const organization = lines[index];
    const next = lines[index + 1] || '';
    const following = lines[index + 2] || '';

    if (isDateLine(next)) {
      items.push({
        title: organization,
        organization: '',
        date: next,
        details: []
      });
      index += 2;
    } else {
      items.push({
        title: next || organization,
        organization,
        date: isDateLine(following) ? following : '',
        details: []
      });
      index += isDateLine(following) ? 3 : 2;
    }
  }

  return items.filter(item => item.title);
}

function getExperienceEntryLeadCount(lines, dateIndex) {
  const previous = lines[dateIndex - 1] || '';
  const beforePrevious = lines[dateIndex - 2] || '';

  if (beforePrevious && !isDurationLine(beforePrevious) && isExperienceOrganizationLine(previous)) {
    return 2;
  }

  return 1;
}

function isExperienceOrganizationLine(line) {
  return line.includes(' · ') ||
    /University|College|Agency|JST|Electric|Toyota|Turing|photonics|株式会社/.test(line);
}

function parseExperienceOrganization(line) {
  const [organization, ...types] = line.split(' · ').map(part => part.trim()).filter(Boolean);

  return {
    organization: organization || '',
    type: types.join(' · ')
  };
}

function findExperienceGroupOrganization(lines, dateIndex) {
  for (let index = dateIndex - 1; index >= 0; index -= 1) {
    if (isDurationLine(lines[index + 1] || '')) {
      return lines[index];
    }
  }

  return '';
}

function parseExperience(text) {
  const lines = getProfileLines(text);
  const dateIndexes = lines
    .map((line, index) => isDateLine(line) ? index : -1)
    .filter(index => index >= 0);
  const items = [];

  dateIndexes.forEach((dateIndex, entryIndex) => {
    const leadCount = getExperienceEntryLeadCount(lines, dateIndex);
    const title = leadCount === 2 ? lines[dateIndex - 2] : lines[dateIndex - 1];
    const organizationData = parseExperienceOrganization(
      leadCount === 2 ? lines[dateIndex - 1] : findExperienceGroupOrganization(lines, dateIndex)
    );
    const nextDateIndex = dateIndexes[entryIndex + 1] ?? lines.length;
    const nextLeadCount = dateIndexes[entryIndex + 1]
      ? getExperienceEntryLeadCount(lines, dateIndexes[entryIndex + 1])
      : 0;
    const detailsEnd = Math.max(dateIndex + 1, nextDateIndex - nextLeadCount);
    const details = lines
      .slice(dateIndex + 1, detailsEnd)
      .filter(line => !isDurationLine(line));

    items.push({
      title,
      organization: organizationData.organization,
      type: organizationData.type,
      date: lines[dateIndex],
      details
    });
  });

  return items.filter(item => item.title);
}

async function loadTimeline(path, target, parser, emptyMessage) {
  if (!target) {
    return;
  }

  try {
    const response = await fetch(path, { cache: 'no-cache' });

    if (!response.ok) {
      throw new Error(`Unable to load ${path}: ${response.status}`);
    }

    renderTimeline(target, parser(await response.text()), emptyMessage);
  } catch (error) {
    renderTimeline(target, [], emptyMessage);
  }
}

loadTimeline('data/education.txt', educationList, parseEducation, 'Education will be listed here.');
loadTimeline('data/experience.txt', experienceList, parseExperience, 'Experience will be listed here.');

// Render publications generated from Zotero data.
const publicationsList = document.querySelector('[data-publications-list]');

function getPublicationYear(publication) {
  if (publication.year) {
    return publication.year;
  }

  const date = publication.date || '';
  const match = date.match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : 'n.d.';
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function createPublicationLink(label, href) {
  const link = document.createElement('a');
  link.className = 'pub-link';
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = label;
  return link;
}

function renderPublications(publications) {
  if (!publicationsList) {
    return;
  }

  publicationsList.textContent = '';

  if (!publications.length) {
    publicationsList.appendChild(
      createTextElement('p', 'placeholder-text', 'Publications will be listed here.')
    );
    return;
  }

  publications.forEach(publication => {
    const item = document.createElement('article');
    item.className = 'publication-item';

    const year = createTextElement('div', 'pub-year', getPublicationYear(publication));
    const body = document.createElement('div');
    body.className = 'pub-body';

    body.appendChild(createTextElement('h3', 'pub-title', publication.title || 'Untitled'));

    if (publication.authors) {
      body.appendChild(createTextElement('p', 'pub-authors', publication.authors));
    }

    if (publication.venue) {
      body.appendChild(createTextElement('p', 'pub-venue', publication.venue));
    }

    const links = document.createElement('div');
    links.className = 'pub-links';

    if (publication.doi) {
      links.appendChild(createPublicationLink('DOI', `https://doi.org/${publication.doi}`));
    }

    if (publication.url) {
      links.appendChild(createPublicationLink('Link', publication.url));
    }

    if (links.children.length) {
      body.appendChild(links);
    }

    item.append(year, body);
    publicationsList.appendChild(item);
  });
}

async function loadPublications() {
  if (!publicationsList) {
    return;
  }

  try {
    const response = await fetch('data/publications.json', { cache: 'no-cache' });

    if (!response.ok) {
      throw new Error(`Unable to load publications: ${response.status}`);
    }

    const payload = await response.json();
    renderPublications(payload.items || []);
  } catch (error) {
    publicationsList.textContent = '';
    publicationsList.appendChild(
      createTextElement(
        'p',
        'placeholder-text',
        'Publications could not be loaded. Please try again later.'
      )
    );
  }
}

loadPublications();
