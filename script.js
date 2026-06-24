const restaurantForm = document.getElementById('restaurant-form');
const restaurantNameInput = document.getElementById('restaurant-name');
const resultPanel = document.getElementById('result-panel');
const restaurantSummary = document.getElementById('restaurant-summary');
const historyPanel = document.getElementById('history-panel');
const addVisitPanel = document.getElementById('add-visit-panel');
const visitForm = document.getElementById('visit-form');
const dishNameInput = document.getElementById('dish-name');
const visitNoteInput = document.getElementById('visit-note');

const suggestedDishes = [
  { restaurant: 'Sushi House', dish: 'Salmon Nigiri', reason: 'Fresh, simple and highly rated.' },
  { restaurant: 'Taqueria Azul', dish: 'Al Pastor Tacos', reason: 'A fan favorite with bold flavors.' },
  { restaurant: 'Pasta Loft', dish: 'Truffle Mushroom Ravioli', reason: 'Creamy, rich and customer-loved.' },
  { restaurant: 'Green Garden', dish: 'Harvest Bowl', reason: 'Light, healthy and popular.' },
  { restaurant: 'BBQ Junction', dish: 'Smoked Brisket Plate', reason: 'Classic crowd-pleaser with a lot of love.' },
];

function getRestaurantData(name) {
  const stored = localStorage.getItem(`restaurant-history:${name.toLowerCase()}`);
  try {
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    return null;
  }
}

function saveRestaurantData(name, data) {
  localStorage.setItem(`restaurant-history:${name.toLowerCase()}`, JSON.stringify(data));
}

function scoreDish(visit) {
  const base = visit.liked ? 1 : 0.2;
  const noteBonus = visit.note ? 0.15 : 0;
  const recencyBonus = Math.max(0, 0.1 - (Date.now() - new Date(visit.savedAt)) / (1000 * 60 * 60 * 24 * 365));
  return base + noteBonus + recencyBonus;
}

function getRestaurantRecommendation(name, visitHistory) {
  if (!visitHistory || !visitHistory.length) {
    return null;
  }

  const likedDishes = visitHistory.filter((visit) => visit.liked);
  if (likedDishes.length) {
    const sortedLikes = [...likedDishes].sort((a, b) => scoreDish(b) - scoreDish(a));
    return {
      dish: sortedLikes[0].dish,
      reason: sortedLikes[0].note
        ? 'You loved this one and left a note for next time.'
        : 'You liked this dish the most during your visits.',
    };
  }

  const sortedAll = [...visitHistory].sort((a, b) => scoreDish(b) - scoreDish(a));
  return {
    dish: sortedAll[0].dish,
    reason: sortedAll[0].note
      ? 'This dish had the strongest positive feedback despite mixed history.'
      : 'This dish performed best in your past visits.',
  };
}

function renderHistory(name, visitHistory) {
  const title = document.createElement('h2');
  title.textContent = `${name} history`;
  const list = document.createElement('ul');
  list.className = 'history-list';

  const sortedHistory = [...visitHistory].sort((a, b) => {
    if (a.liked === b.liked) {
      return new Date(b.savedAt) - new Date(a.savedAt);
    }
    return a.liked ? -1 : 1;
  });

  sortedHistory.forEach((visit, index) => {
    const item = document.createElement('li');
    item.className = 'history-item';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.flexWrap = 'wrap';

    const when = document.createElement('strong');
    when.textContent = `Visit ${index + 1}: ${visit.dish}`;

    const likedChip = document.createElement('span');
    likedChip.className = `status-chip status-chip--${visit.liked ? 'yes' : 'no'}`;
    likedChip.textContent = visit.liked ? 'Liked it' : 'Did not like it';

    header.append(when, likedChip);

    const notesLabel = document.createElement('label');
    notesLabel.textContent = 'Notes';
    notesLabel.style.display = 'block';
    notesLabel.style.marginTop = '14px';
    notesLabel.style.fontWeight = '600';

    const notesInput = document.createElement('textarea');
    notesInput.className = 'visit-note';
    notesInput.value = visit.note || '';
    notesInput.placeholder = 'Add or update your notes';

    const editActions = document.createElement('div');
    editActions.className = 'edit-actions';

    const saveNoteButton = document.createElement('button');
    saveNoteButton.type = 'button';
    saveNoteButton.className = 'small-button';
    saveNoteButton.textContent = 'Save notes';
    saveNoteButton.addEventListener('click', () => {
      visit.note = notesInput.value.trim();
      saveRestaurantData(name, { visits: visitHistory });
      showExistingRestaurant(name, visitHistory);
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'small-button';
    deleteButton.style.background = '#f8d7da';
    deleteButton.style.color = '#842029';
    deleteButton.textContent = 'Delete visit';
    deleteButton.addEventListener('click', () => {
      const remaining = visitHistory.filter((saved) => saved !== visit);
      saveRestaurantData(name, { visits: remaining });
      if (remaining.length) {
        showExistingRestaurant(name, remaining);
      } else {
        renderSuggestion(name, remaining);
      }
    });

    editActions.append(saveNoteButton, deleteButton);
    item.append(header, notesLabel, notesInput, editActions);
    list.appendChild(item);
  });

  historyPanel.innerHTML = '';
  historyPanel.append(title, list);
}

function renderSuggestion(name, visitHistory) {
  const suggestionFromHistory = getRestaurantRecommendation(name, visitHistory);
  const suggestion =
    suggestionFromHistory ||
    suggestedDishes.find((item) => item.restaurant.toLowerCase() === name.toLowerCase()) ||
    suggestedDishes[0];

  restaurantSummary.innerHTML = `
    <h2>${visitHistory && visitHistory.length ? `Next idea for ${name}` : `New restaurant: ${name}`}</h2>
    <p>${suggestionFromHistory ? 'Based on your past favorites:' : 'It looks like you haven’t recorded a visit yet. Here’s a top recommendation:'}</p>
    <div class="history-item">
      <strong>${suggestion.dish}</strong>
      <p>${suggestion.reason}</p>
    </div>
  `;

  historyPanel.innerHTML = '';
  addVisitPanel.classList.remove('hidden');
}

function showExistingRestaurant(name, visitHistory) {
  const likes = visitHistory.filter((visit) => visit.liked).length;
  const dislikes = visitHistory.length - likes;
  const recommendation = getRestaurantRecommendation(name, visitHistory);

  restaurantSummary.innerHTML = `
    <h2>${name}</h2>
    <p>You’ve visited ${visitHistory.length} time${visitHistory.length === 1 ? '' : 's'}.</p>
    <p>Top dish: <strong>${recommendation.dish}</strong> (${likes} liked, ${dislikes} disliked)</p>
  `;

  renderHistory(name, visitHistory);
  addVisitPanel.classList.remove('hidden');
}

function clearResult() {
  restaurantSummary.innerHTML = '';
  historyPanel.innerHTML = '';
  addVisitPanel.classList.add('hidden');
}

restaurantForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const restaurantName = restaurantNameInput.value.trim();
  if (!restaurantName) {
    return;
  }

  const data = getRestaurantData(restaurantName);
  resultPanel.classList.remove('hidden');

  if (data && data.visits?.length > 0) {
    showExistingRestaurant(restaurantName, data.visits);
  } else {
    renderSuggestion(restaurantName, data?.visits || []);
  }

  dishNameInput.value = '';
  visitNoteInput.value = '';
});

visitForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const restaurantName = restaurantNameInput.value.trim();
  const dishName = dishNameInput.value.trim();
  const liked = visitForm.liked.value === 'yes';
  const note = visitNoteInput.value.trim();

  if (!restaurantName || !dishName) {
    return;
  }

  const data = getRestaurantData(restaurantName) || { visits: [] };
  data.visits.push({
    dish: dishName,
    liked,
    note,
    savedAt: new Date().toISOString(),
  });

  saveRestaurantData(restaurantName, data);
  showExistingRestaurant(restaurantName, data.visits);
  dishNameInput.value = '';
  visitNoteInput.value = '';
  visitForm.liked.value = 'yes';
});

window.addEventListener('DOMContentLoaded', () => {
  const savedRestaurant = localStorage.getItem('recent-restaurant');
  if (savedRestaurant) {
    restaurantNameInput.value = savedRestaurant;
  }
});

restaurantNameInput.addEventListener('input', () => {
  localStorage.setItem('recent-restaurant', restaurantNameInput.value.trim());
});
