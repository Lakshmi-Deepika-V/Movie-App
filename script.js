document.addEventListener('DOMContentLoaded', function () {
const API_KEY = 'a716527a40b65a0091ab7fc3309da751';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const YOUTUBE_BASE = 'https://www.youtube.com/watch?v=';

const movieContainer = document.getElementById('movieList');     // ✅ Correct ID
const genreFilter = document.getElementById('genreSelect');      // ✅ Correct ID
const yearFilter = document.getElementById('yearSelect');        // ✅ Correct ID
const languageFilter = document.getElementById('langSelect');    // ✅ Correct ID
const themeToggle = document.getElementById('darkToggle');       // ✅ Correct ID
const spinner = document.getElementById('loader');  
const searchInput = document.getElementById('searchInput');
const scrollTopBtn = document.getElementById('scrollTopBtn');

let currentPage = 1;
let currentQuery = '';
let currentGenre = '';
let currentYear = '';
let currentLanguage = '';
let currentMode = 'popular';
let allGenres = [];

window.addEventListener('DOMContentLoaded', () => {
  setupTheme();
  fetchGenres();
  fetchMovies();
});

function setupTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  document.body.classList.toggle('dark', theme === 'dark');
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  themeToggle.textContent = isDark ? '☀️' : '🌙';
});

searchInput.addEventListener('input', debounce(() => {
  currentQuery = searchInput.value.trim();
  currentPage = 1;
  currentMode = currentQuery ? 'search' : 'popular';
  movieContainer.innerHTML = '';
  fetchMovies();
}, 600));

genreFilter.addEventListener('change', () => {
  currentGenre = genreFilter.value;
  resetAndFetch();
});
yearFilter.addEventListener('change', () => {
  currentYear = yearFilter.value;
  resetAndFetch();
});
languageFilter.addEventListener('change', () => {
  currentLanguage = languageFilter.value;
  resetAndFetch();
});
loadMoreBtn.addEventListener('click', () => {
  currentPage++;
  fetchMovies();
});
scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

async function fetchMovies() {
  showSpinner(true);
  let url = '';
  if (currentMode === 'search') {
    url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${currentQuery}&page=${currentPage}`;
  } else {
    url = `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${currentPage}`;
  }

  if (currentGenre) url += `&with_genres=${currentGenre}`;
  if (currentYear) url += `&primary_release_year=${currentYear}`;
  if (currentLanguage) url += `&with_original_language=${currentLanguage}`;

  const res = await fetch(url);
  const data = await res.json();
  showSpinner(false);

  if (data.results.length === 0 && currentPage === 1) {
    movieContainer.innerHTML = `<p class="not-found">No results found. Try another search.</p>`;
    loadMoreBtn.classList.add('hidden');
    return;
  }

  displayMovies(data.results);
  loadMoreBtn.classList.remove('hidden');
}

function displayMovies(movies) {
  movies.forEach(movie => {
    const div = document.createElement('div');
    div.classList.add('movie-card');
    div.innerHTML = `
      <img src="${movie.poster_path ? IMG_URL + movie.poster_path : 'placeholder.jpg'}" alt="${movie.title}">
      <div class="movie-info">
        <h3>${movie.title}</h3>
        <span class="rating ${getRatingColor(movie.vote_average)}">${movie.vote_average}</span>
        <p>${movie.release_date || 'Unknown'}</p>
        <button class="details-btn" onclick="showMovieDetails(${movie.id})">More Info</button>
      </div>
    `;
    movieContainer.appendChild(div);
  });
}

function getRatingColor(rating) {
  if (rating >= 7) return 'green';
  if (rating >= 5) return 'orange';
  return 'red';
}

async function showMovieDetails(id) {
  const res = await fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&append_to_response=videos`);
  const movie = await res.json();

  const modal = document.createElement('div');
  modal.className = 'movie-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-btn" onclick="this.parentElement.parentElement.remove()">×</span>
      <h2>${movie.title}</h2>
      <img src="${IMG_URL + movie.poster_path}" class="modal-img">
      <p><strong>Genres:</strong> ${movie.genres.map(g => g.name).join(', ')}</p>
      <p><strong>Overview:</strong> ${movie.overview}</p>
      <p><strong>Runtime:</strong> ${movie.runtime} mins</p>
      <p><strong>Language:</strong> ${movie.original_language.toUpperCase()}</p>
      <p><strong>Release Date:</strong> ${movie.release_date}</p>
      <a href="${getTrailer(movie.videos)}" target="_blank" class="trailer-btn">Watch Trailer 🎬</a>
      <button onclick="addToWatchlist(${movie.id}, '${movie.title}')">Add to Watchlist 💾</button>
    </div>
  `;
  document.body.appendChild(modal);
}

function getTrailer(videos) {
  const trailer = videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  return trailer ? YOUTUBE_BASE + trailer.key : '#';
}

function showSpinner(show) {
  spinner.classList.toggle('hidden', !show);
}

function resetAndFetch() {
  currentPage = 1;
  movieContainer.innerHTML = '';
  fetchMovies();
}

function debounce(fn, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

function addToWatchlist(id, title) {
  let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
  if (!watchlist.includes(id)) {
    watchlist.push(id);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    alert(`Added "${title}" to Watchlist!`);
  } else {
    alert(`"${title}" is already in your Watchlist.`);
  }
}

async function fetchGenres() {
  const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
  const data = await res.json();
  allGenres = data.genres;
  genreFilter.innerHTML = `<option value="">All</option>` +
    allGenres.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
}
});