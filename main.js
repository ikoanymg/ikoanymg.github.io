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
