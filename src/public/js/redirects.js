
function goToModules() {
    window.location.href = "/modules";
};

function goToDashboard() {
    window.location.href = "/dashboard";
}

const seasonSelect = document.getElementById('season-select');
seasonSelect.addEventListener('change', function(event) {
    window.location.href = `${window.location.href.split('?')[0]}?s=${event.target.value}&ep=1`;
});

const episodeSelect = document.getElementById('episode-select');
episodeSelect.forEach(function(button) {
    button.addEventListener('click', function(event) {
        window.location.href = `${window.location.href.split('?')[0]}?s=${seasonSelect.value}&ep=${button.dataset.episode}`;
    });
});