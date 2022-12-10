const API_URL = "https://factual-ancient-brisket.glitch.me/";
let dataMusic = [];
let playlist = [];

const favouriteMusic = localStorage.getItem("favourite") ? JSON.parse(localStorage.getItem("favourite")) : [];

const audio = new Audio();
const tracksCard = document.getElementsByClassName("track");

const player = document.querySelector(".player");
const pauseBtn = document.querySelector(".player__action_pause");
const stopBtn = document.querySelector(".player__action_stop");
const prevBtn = document.querySelector(".player__action_prev");
const nextBtn = document.querySelector(".player__action_next");
const muteBtn = document.querySelector(".player__action_mute");
const favouriteBtn = document.querySelector(".player__action_favourite");
const playerRange = document.querySelector(".player__range");
const playerTimePassed = document.querySelector(".player__time-passed");
const playerTimeTotal = document.querySelector(".player__time-total");
const volumeRange = document.querySelector(".player__volume-range");

const trackTitle = document.querySelector(".track-info__title");
const trackArtist = document.querySelector(".track-info__artist");

const headerLogo = document.querySelector(".header__logo");
const searchForm = document.querySelector(".header__form");
const headerFavouriteBtn = document.querySelector(".header__favourite");

const catalogList = document.querySelector(".catalog__list");

function throttle(callee, timeout) {
  let timer = null;
  return function perform(...args) {
    if (timer) return;
    timer = setTimeout(() => {
      callee(...args);
      clearTimeout(timer);
      timer = null;
    }, timeout);
  };
}

const pausePlayer = () => {
  const trackActive = document.querySelector(".catalog__track_active");
  if (audio.paused) {
    audio.play();
    pauseBtn.classList.remove("player__action_play");
    trackActive.classList.remove("catalog__track_pause");
  } else {
    audio.pause();
    pauseBtn.classList.add("player__action_play");
    trackActive.classList.add("catalog__track_pause");
  }
};

const playMusic = (e) => {
  e.preventDefault();
  const trackActive = e.currentTarget;

  if (trackActive.classList.contains("catalog__track_active")) {
    pausePlayer();
    return;
  }

  const id = trackActive.dataset.track;

  const index = favouriteMusic.indexOf(id);

  if (index !== -1) {
    favouriteBtn.classList.add("player__action_favourite_active");
  } else {
    favouriteBtn.classList.remove("player__action_favourite_active");
  }

  let i = 0;
  const track = playlist.find((item, index) => {
    i = index;
    return id === item.id;
  });

  audio.src = `${API_URL}${track.mp3}`;
  //audio.src = track.mp3;

  trackArtist.textContent = track.artist;
  trackTitle.textContent = track.track;
  audio.play();
  pauseBtn.classList.remove("player__action_play");
  player.classList.add("player_active");
  player.dataset.track = id;

  const prevTrack = i === 0 ? playlist.length - 1 : i - 1;
  const nextTrack = i + 1 === playlist.length ? 0 : i + 1;
  prevBtn.dataset.track = playlist[prevTrack].id;
  nextBtn.dataset.track = playlist[nextTrack].id;
  favouriteBtn.dataset.track = id;

  for (let i = 0; i < tracksCard.length; i++) {
    if (id === tracksCard[i].dataset.track) {
      tracksCard[i].classList.add("catalog__track_active");
    } else {
      tracksCard[i].classList.remove("catalog__track_active");
    }
  }
};

const addClickTrack = () => {
  for (let i = 0; i < tracksCard.length; i++) {
    tracksCard[i].addEventListener("click", playMusic);
  }
};

const renderCard = (item) => {
  const li = document.createElement("li");

  li.classList.add("catalog__item");
  li.innerHTML = `
        <a class="catalog__track track" href="#" data-track="${item.id}">
          <div class="track__img-inner">
            <img class="track__img" src="${API_URL}${item.poster}" alt="${item.artist} ${item.track}" />
          </div>
          <div class="track__info track-info">
            <p class="track-info__title">${item.track}</p>
            <p class="track-info__artist">${item.artist}</p>
          </div>
        </a>
    `;
  if (player.dataset.track === item.id) {
    li.firstElementChild.classList.add("catalog__track_active");
    if (audio.paused) {
      li.firstElementChild.classList.add("catalog__track_pause");
    }
  }
  return li;
};

const renderCatalog = (dataList) => {
  playlist = [...dataList];
  if (playlist.length === 0) {
    catalogList.textContent = `Ничего не найдено`;
    return;
  }
  catalogList.textContent = ``;
  const listCards = dataList.map(renderCard);
  catalogList.append(...listCards);
  addClickTrack();
  const catalogAddBtn = createAddBtn();
  checkCount(catalogAddBtn);
};

const checkCount = (catalogAddBtn, i = 1) => {
  if (catalogList.children.length === 0) {
    return;
  }

  if (catalogList.clientHeight > tracksCard[0].clientHeight * 3) {
    tracksCard[tracksCard.length - i].style.display = "none";
    return checkCount(catalogAddBtn, i + 1);
  } else if (i !== 1) {
    catalogList.append(catalogAddBtn);
  }
};

const updateTime = () => {
  const total = audio.duration;
  const currentTime = audio.currentTime;
  const progress = (currentTime / total) * playerRange.max;
  playerRange.value = progress ? progress : 0;

  const minutesPassed = Math.floor(currentTime / 60) || "0";
  const secondsPassed = Math.floor(currentTime % 60) || "0";

  const minutesTotal = Math.floor(total / 60) || "0";
  const secondsTotal = Math.floor(total % 60) || "0";

  playerTimePassed.textContent = `${minutesPassed}:${secondsPassed < 10 ? "0" + secondsPassed : secondsPassed}`;
  playerTimeTotal.textContent = `${minutesTotal}:${secondsTotal < 10 ? "0" + secondsTotal : secondsTotal}`;
};

const createAddBtn = () => {
  const catalogAddBtn = document.createElement("div");
  catalogAddBtn.classList.add("catalog__show-more-inner");

  catalogAddBtn.innerHTML = `
    <button class="catalog__show-more">Увидеть всё</button>
   `;

  catalogAddBtn.addEventListener("click", function () {
    [...tracksCard].forEach((item) => {
      item.style.display = ``;
      catalogAddBtn.remove();
    });
  });

  return catalogAddBtn;
};

const eventListeners = () => {
  prevBtn.addEventListener("click", playMusic);
  nextBtn.addEventListener("click", playMusic);
  pauseBtn.addEventListener("click", pausePlayer);

  audio.addEventListener("ended", function () {
    nextBtn.dispatchEvent(new Event("click", { bubbles: true }));
  });

  const updateTimeThrottle = throttle(updateTime, 700);
  audio.addEventListener("timeupdate", updateTimeThrottle);

  playerRange.addEventListener("change", function () {
    const progress = playerRange.value;
    audio.currentTime = (progress / playerRange.max) * audio.duration;
  });

  headerFavouriteBtn.addEventListener("click", function () {
    const data = dataMusic.filter((item) => favouriteMusic.includes(item.id));
    renderCatalog(data);
  });

  stopBtn.addEventListener("click", function (e) {
    audio.src = ``;
    player.classList.remove("player_active");

    if (document.querySelector(".catalog__track_active")) {
      document.querySelector(".catalog__track_active").classList.remove("catalog__track_active");
    }
  });

  headerLogo.addEventListener("click", function () {
    renderCatalog(dataMusic);
  });

  favouriteBtn.addEventListener("click", function () {
    const index = favouriteMusic.indexOf(favouriteBtn.dataset.track);

    if (index === -1) {
      favouriteMusic.push(favouriteBtn.dataset.track);
      favouriteBtn.classList.add("player__action_favourite_active");
    } else {
      favouriteMusic.splice(index, 1);
      favouriteBtn.classList.remove("player__action_favourite_active");
    }

    localStorage.setItem("favourite", JSON.stringify(favouriteMusic));
  });

  volumeRange.addEventListener("input", function () {
    muteBtn.classList.remove("player__action_unmute");
    const value = volumeRange.value;
    audio.volume = value / 100;
  });

  muteBtn.addEventListener("click", function () {
    if (audio.volume) {
      localStorage.setItem("volume", audio.volume);
      audio.volume = 0;
      muteBtn.classList.add("player__action_unmute");
      volumeRange.value = 0;
    } else {
      audio.volume = localStorage.getItem("volume");
      muteBtn.classList.remove("player__action_unmute");
      volumeRange.value = audio.volume * 100;
    }
  });

  searchForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    playlist = await fetch(`${API_URL}api/music?search=${searchForm.search.value}`).then((data) => data.json());
    renderCatalog(playlist);
    eventListeners();
  });
};

const init = async () => {
  audio.volume = localStorage.getItem("volume") || 1;
  volumeRange.value = audio.volume * 100;

  dataMusic = await fetch(`${API_URL}api/music`).then((data) => data.json());

  renderCatalog(dataMusic);
  eventListeners();
};

init();
