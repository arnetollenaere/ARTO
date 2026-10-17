// Kleine verbetering: toon een bedankje na het versturen van het formulier.
if (new URLSearchParams(location.search).has('verzonden')) {
  const f = document.querySelector('.formulier');
  if (f) f.insertAdjacentHTML('beforebegin', '<p class="bedankt" role="status">Bedankt! We antwoorden zo snel mogelijk.</p>');
}
