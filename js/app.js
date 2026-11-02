const STORAGE_KEY = "log3550-livres";
const categories = {
  roman: "Roman",
  science: "Science",
  histoire: "Histoire",
  informatique: "Informatique",
  autre: "Autre"
};

let livres = chargerLivres();

const elements = {
  bookList: document.querySelector("#book-list"),
  emptyState: document.querySelector("#empty-state"),
  resultCount: document.querySelector("#result-count"),
  search: document.querySelector("#search"),
  categoryFilter: document.querySelector("#category-filter"),
  availableOnly: document.querySelector("#available-only"),
  sort: document.querySelector("#sort"),
  resetButton: document.querySelector("#reset-button"),
  bookForm: document.querySelector("#book-form"),
  formSuccess: document.querySelector("#form-success")
};

function chargerLivres() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(window.livresInitiaux);
  try {
    return JSON.parse(saved);
  } catch {
    return structuredClone(window.livresInitiaux);
  }
}

function sauvegarderLivres() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(livres));
}

function normaliser(texte) {
  return texte
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function obtenirLivresFiltres() {
  const recherche = normaliser(elements.search.value.trim());
  const categorie = elements.categoryFilter.value;
  const disponiblesSeulement = elements.availableOnly.checked;
  const tri = elements.sort.value;

  const filtres = livres.filter((livre) => {
    const texteLivre = normaliser(`${livre.titre} ${livre.auteur}`);
    const correspondRecherche = texteLivre.includes(recherche);
    const correspondCategorie = !categorie || livre.categorie === categorie;
    const correspondDisponibilite = !disponiblesSeulement || livre.disponible;
    return correspondRecherche && correspondCategorie && correspondDisponibilite;
  });

  return filtres.sort((a, b) => {
    if (tri === "title-asc") return a.titre.localeCompare(b.titre, "fr");
    if (tri === "title-desc") return b.titre.localeCompare(a.titre, "fr");
    if (tri === "year-asc") return a.annee - b.annee;
    return b.annee - a.annee;
  });
}

function creerCarte(livre) {
  const card = document.createElement("article");
  card.className = "book-card";
  card.dataset.id = livre.id;

  const category = document.createElement("span");
  category.className = "book-category";
  category.textContent = categories[livre.categorie];

  const title = document.createElement("h3");
  title.textContent = livre.titre;

  const author = document.createElement("p");
  author.className = "book-meta";
  author.textContent = `Par ${livre.auteur} · ${livre.annee}`;

  const footer = document.createElement("div");
  footer.className = "card-footer";

  const status = document.createElement("span");
  status.className = `status ${livre.disponible ? "status-available" : "status-borrowed"}`;
  status.textContent = livre.disponible ? "Disponible" : "Emprunté";

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.textContent = "Supprimer";
  deleteButton.setAttribute("aria-label", `Supprimer le livre ${livre.titre}`);
  deleteButton.addEventListener("click", () => supprimerLivre(livre.id));

  footer.append(status, deleteButton);
  card.append(category, title, author, footer);
  return card;
}

function afficherLivres() {
  const resultats = obtenirLivresFiltres();
  elements.bookList.replaceChildren();
  resultats.forEach((livre) => elements.bookList.append(creerCarte(livre)));
  elements.resultCount.textContent = `${resultats.length} livre${resultats.length > 1 ? "s" : ""} affiché${resultats.length > 1 ? "s" : ""}`;
  elements.emptyState.hidden = resultats.length !== 0;
}

function supprimerLivre(id) {
  const livre = livres.find((item) => item.id === id);
  if (!livre || !window.confirm(`Voulez-vous vraiment supprimer « ${livre.titre} » ?`)) return;
  livres = livres.filter((item) => item.id !== id);
  sauvegarderLivres();
  afficherLivres();
}

function validerChamp(input, message) {
  const error = document.querySelector(`#${input.id}-error`);
  error.textContent = input.validity.valid ? "" : message;
  input.setAttribute("aria-invalid", String(!input.validity.valid));
  return input.validity.valid;
}

function validerFormulaire(formData) {
  const title = document.querySelector("#title");
  const author = document.querySelector("#author");
  const year = document.querySelector("#year");
  const category = document.querySelector("#category");
  const currentYear = new Date().getFullYear();
  year.max = currentYear;

  const titleValid = validerChamp(title, "Le titre doit contenir au moins 2 caractères.");
  const authorValid = validerChamp(author, "L’auteur doit contenir au moins 2 caractères.");
  const yearValid = Number(formData.get("year")) >= 1450 && Number(formData.get("year")) <= currentYear;
  document.querySelector("#year-error").textContent = yearValid ? "" : `L’année doit être comprise entre 1450 et ${currentYear}.`;
  year.setAttribute("aria-invalid", String(!yearValid));
  const categoryValid = Boolean(formData.get("category"));
  document.querySelector("#category-error").textContent = categoryValid ? "" : "Choisissez une catégorie.";
  category.setAttribute("aria-invalid", String(!categoryValid));
  return titleValid && authorValid && yearValid && categoryValid;
}

function ajouterLivre(event) {
  event.preventDefault();
  const formData = new FormData(elements.bookForm);
  if (!validerFormulaire(formData)) return;

  const nouveauLivre = {
    id: Date.now(),
    titre: formData.get("title").trim(),
    auteur: formData.get("author").trim(),
    annee: Number(formData.get("year")),
    categorie: formData.get("category"),
    disponible: formData.get("available") === "on"
  };

  livres.push(nouveauLivre);
  sauvegarderLivres();
  elements.bookForm.reset();
  document.querySelector("#available").checked = true;
  elements.formSuccess.textContent = `« ${nouveauLivre.titre} » a été ajouté au catalogue.`;
  afficherLivres();
  document.querySelector("#catalogue").scrollIntoView({ behavior: "smooth" });
}

function reinitialiserDonnees() {
  if (!window.confirm("Réinitialiser la liste avec les données de départ ?")) return;
  livres = structuredClone(window.livresInitiaux);
  sauvegarderLivres();
  elements.formSuccess.textContent = "";
  afficherLivres();
}

[elements.search, elements.categoryFilter, elements.availableOnly, elements.sort].forEach((control) => {
  control.addEventListener("input", afficherLivres);
  control.addEventListener("change", afficherLivres);
});
elements.bookForm.addEventListener("submit", ajouterLivre);
elements.resetButton.addEventListener("click", reinitialiserDonnees);
afficherLivres();
