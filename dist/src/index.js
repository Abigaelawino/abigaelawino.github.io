const { generateContentIndexes } = require('./content.js');
const { DEFAULT_ABOUT_CONTENT, renderAboutPage } = require('./about.js');
const {
  DEFAULT_CONTACT_COPY,
  DEFAULT_CONTACT_LINKS,
  DEFAULT_CONTACT_THANKS_COPY,
  renderContactPage,
  renderContactThanksPage,
} = require('./contact.js');
const { DEFAULT_HOME_LINKS, renderHomePage } = require('./home.js');
const { DEFAULT_RESUME_ASSET_PATH, DEFAULT_RESUME_CONTENT, renderResumePage } = require('./resume.js');
const { formatReadingTime, renderBlogCard, renderBlogIndexPage, renderBlogPostPage } = require('./blog.js');
const {
  SUPPORTED_PROJECT_FILTERS,
  filterProjectsByTag,
  renderProjectCaseStudy,
  renderProjectCard,
  renderProjectsPage,
} = require('./projects.js');

/**
 * Returns the website title used by the app shell.
 * @returns {string}
 */
function getSiteTitle() {
  return 'Abigael Awino Portfolio';
}

module.exports = {
  generateContentIndexes,
  getSiteTitle,
  DEFAULT_ABOUT_CONTENT,
  renderAboutPage,
  DEFAULT_CONTACT_COPY,
  DEFAULT_CONTACT_LINKS,
  DEFAULT_CONTACT_THANKS_COPY,
  renderContactPage,
  renderContactThanksPage,
  DEFAULT_HOME_LINKS,
  DEFAULT_RESUME_ASSET_PATH,
  DEFAULT_RESUME_CONTENT,
  SUPPORTED_PROJECT_FILTERS,
  filterProjectsByTag,
  renderHomePage,
  renderResumePage,
  formatReadingTime,
  renderBlogCard,
  renderBlogIndexPage,
  renderBlogPostPage,
  renderProjectCaseStudy,
  renderProjectCard,
  renderProjectsPage,
};
