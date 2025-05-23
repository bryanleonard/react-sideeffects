import { useRef, useState, useEffect, useCallback } from "react";

import Places from "./components/Places.jsx";
import { AVAILABLE_PLACES } from "./data.js";
import Modal from "./components/Modal.jsx";
import DeleteConfirmation from "./components/DeleteConfirmation.jsx";
import logoImg from "./assets/logo.png";
import { sortPlacesByDistance } from "./loc.js";

//This runs once and allows us to load picked places
const storedIds = JSON.parse(localStorage.getItem('selectedPlaces')) || [];
const storedPlaces = storedIds
  .map((id) => AVAILABLE_PLACES.find((place) => place.id === id))
  .filter(place => place); // Filter out any undefined results


function App() {
	// const modal = useRef();
  const [modalIsOpen, setModalIsOpen] = useState(false)
	const selectedPlace = useRef();
	const [availablePlaces, setAvailablePlaces] = useState([]);
	const [pickedPlaces, setPickedPlaces] = useState(storedPlaces); //useState would be [] in antipattern version

	//loading saved places onload
	//this is an anti-pattern because it runs synchronously
	// it runs before the App component is finished running
	// useEffect(() => {
	//   const storedIds = JSON.parse(localStorage.getItem('selectedPlaces')) || [];
	//   const storedPlaces = storedIds.map((id) => AVAILABLE_PLACES.find((place) => place.id === id))
	//   setPickedPlaces(storedPlaces);
	// }, []);

	useEffect(() => {
		navigator.geolocation.getCurrentPosition((position) => {
			const sortedPlaces = sortPlacesByDistance(
				AVAILABLE_PLACES,
				position.coords.latitude,
				position.coords.longitude
			);

			setAvailablePlaces(sortedPlaces);
		});
	}, []);

	function handleStartRemovePlace(id) {
		// modal.current.open();
    setModalIsOpen(true);
		selectedPlace.current = id;
	}

	function handleStopRemovePlace() {
		// modal.current.close();
    setModalIsOpen(false);
	}

	function handleSelectPlace(id) {
		setPickedPlaces((prevPickedPlaces) => {
			if (prevPickedPlaces.some((place) => place.id === id)) {
				return prevPickedPlaces;
			}
			const place = AVAILABLE_PLACES.find((place) => place.id === id);
			return [place, ...prevPickedPlaces];
		});

		const storedIds = JSON.parse(localStorage.getItem("selectedPlaces")) || [];
		if (storedIds.indexOf(id) === -1) {
			localStorage.setItem('selectedPlaces', JSON.stringify([id, ...storedIds]));
		}
	}

  //useCallback prevent infinite loop when passing functions as dependencies (onConfirm in DeleteConfirmation)
  const handleRemovePlace = useCallback(function handleRemovePlace() {
		setPickedPlaces((prevPickedPlaces) =>
			prevPickedPlaces.filter((place) => place.id !== selectedPlace.current)
		);
		// modal.current.close();
    setModalIsOpen(false);

		const storedIds = JSON.parse(localStorage.getItem("selectedPlaces")) || [];
		localStorage.setItem(
			'selectedPlaces',
			JSON.stringify(
				storedIds.filter((id) => id !== selectedPlace.current)
			)
		);
	}, []); // Add prop or state values in 2nd arg (or state-dependent items like context values, or other fns) if needed.
	

	return (
		<>
			{/* <Modal ref={modal}> */}
			<Modal open={modalIsOpen} onClose={handleStopRemovePlace}>
				<DeleteConfirmation
					onCancel={handleStopRemovePlace}
					onConfirm={handleRemovePlace}
				/>
			</Modal>

			<header>
				<img src={logoImg} alt="Stylized globe" />
				<h1>PlacePicker</h1>
				<p>
					Create your personal collection of places you would like to visit or
					you have visited.
				</p>
			</header>
			<main>
				<Places
					title="I'd like to visit"
					fallbackText={"Select the places you would like to visit below."}
					places={pickedPlaces}
					onSelectPlace={handleStartRemovePlace}
				/>
				<Places
					title="Available places"
					places={availablePlaces}
					fallbackText="Sorting by distance..."
					onSelectPlace={handleSelectPlace}
				/>
			</main>
		</>
	);
}

export default App;
