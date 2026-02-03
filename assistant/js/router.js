/**
 * Router Module
 * @module router
 * Handles client-side hash-based routing and navigation
 * @module router
 */

import { renderProjectsList, renderNewProjectForm, renderEditProjectForm } from './views.js';
import { renderProjectView } from './project-view.js';
import storage from './storage.js';
import { formatBytes } from './ui.js';

let currentRoute = null;

/**
 * Initialize the router
 * @module router
 */
export function initRouter() {
  // Handle browser back/forward buttons
  window.addEventListener('popstate', handlePopState);

  // Handle initial route
  const path = window.location.hash.slice(1) || 'home';
  navigateTo(path, false);
}

/**
 * Navigate to a route
 * @module router
 * @param {string} route - Route path (e.g., 'home', 'project/123')
 * @param {boolean} pushState - Whether to push to browser history
 */
export function navigateTo(route, pushState = true) {
  const [path, param] = route.split('/');

  if (pushState) {
    window.history.pushState({ route }, '', `#${route}`);
  }

  currentRoute = route;
  renderRoute(path, param);
}

/**
 * Handle browser back/forward navigation
 * @module router
 */
function handlePopState(event) {
  const route = event.state?.route || 'home';
  navigateTo(route, false);
}

/**
 * Update storage info in footer
 * @module router
 */
export async function updateStorageInfo() {
  try {
    const info = await storage.getStorageInfo();
    const projects = await storage.getAllProjects();
    const el = document.getElementById('storage-info');

    if (info && el) {
      el.textContent = `${projects.length} projects • ${formatBytes(info.usage)} used (${info.percentage}%)`;
    } else if (el) {
      el.textContent = `${projects.length} projects stored locally`;
    }
  } catch (error) {
    console.error('Failed to update storage info:', error);
  }
}

/**
 * Render the current route
 * @module router
 */
async function renderRoute(path, param) {
  try {
    switch (path) {
    case 'home':
    case '':
      await renderProjectsList();
      break;

    case 'new':
      renderNewProjectForm();
      break;

    case 'edit':
      if (param) {
        const project = await storage.getProject(param);
        if (project) {
          renderEditProjectForm(project);
        } else {
          navigateTo('home');
        }
      } else {
        navigateTo('home');
      }
      break;

    case 'project':
      if (param) {
        await renderProjectView(param);
      } else {
        navigateTo('home');
      }
      break;

    default:
      navigateTo('home');
      break;
    }

    // Always update footer after route render
    await updateStorageInfo();
  } catch (error) {
    console.error('Route rendering error:', error);
    navigateTo('home');
  }
}

/**
 * Get current route
 * @module router
 */
export function getCurrentRoute() {
  return currentRoute;
}
