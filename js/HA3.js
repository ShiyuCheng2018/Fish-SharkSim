/* Author: Shiyu Cheng 23329948
    Date: 2/1/2019
    CSC 343 HCI SP2019
    Assignment 2: This is a simulation of fishes and sharks
    in a sea function.
*/

var sharks = {
	signal: {
		increment: 'INCREMENT',
		add: 'ADD',
		drawGrid: "DRAWGRID",
		addAnimal: 'ADDANIMAL'
	},
	animal: {
		FISH: 1,
		SHARK: 2
	},
	movement: {
		RIGHT: 1,
		LEFT: -1
	}
};

document.addEventListener("DOMContentLoaded", function (event) {
	var model = makeModel();
	var controlsView = makeControlsView(model, 'textinput', 'enter', 'advance');
	var gridView = makeGridView(model, 'gridDiv');
	var controller = makeController(model);

	model.register(gridView.render);
	controlsView.register(controlsView.render);
	controlsView.register(controller.dispatch);
});

// makeSignaller creates signaller objects (from lecture)
var makeSignaller = function () {
	var _subscribers = [];

	return {
		// Add a subscriber function to our list
		add: function (s) {
			_subscribers.push(s);

		},

		// Notify all subscribers by calling the function
		// in our list with the passed arguments.
		notify: function (args) {

			for (var i = 0; i < _subscribers.length; i++) {
				_subscribers[i](args);
			}
		}
	};
}


// makeModel creates the model.
//
// In this case, the model is the entire Fish Grid
var makeModel = function () {
	var _gridx = 0;
	var _gridy = 0;
	var _grid = [];
	var _observers = makeSignaller();

	// This getRandomInt function from
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
	var _getRandomInt = function (max) {
		return Math.floor(Math.random() * Math.floor(max));
	}

	// Creates a new grid of fish cells
	//
	// Inputs:
	//   x: the x dimension of the grid
	//   y: the y dimension of the grid
	//
	// Returns:
	//   The grid as represented by an array of arrays
	var _createGrid = function (x, y) {
		var new_grid = [];
		for (var i = 0; i < y; i++) {
			new_grid.push([]);
			for (var j = 0; j < x; j++) {
				new_grid[i].push(makeFishCell());
			}
		}
		_gridx = x;
		_gridy = y;
		return new_grid;
	};

	// Adds a fish object to the grid
	//
	// Inputs:
	//   x: the x coordinate to add to
	//   y: the y coordinate to add to
	//   fish: the fish object to add
	var _addToCell = function (x, y, fish) {
		_grid[y][x].addFish(fish);
	}

	// Moves the given fish in the grid
	//
	// Inputs:
	//   x: the initial x coordinate of the given fish
	//   y: the initial y coordinate of the given fish
	//   fish: the fish object to move
	//
	// Returns:
	//   The new position of the fish as an object {x, y}
	var _moveFish = function (x, y, fish) {
		var position = {
			x: x,
			y: y
		};

		// Fish type determines the stride
		// Fish movement determines the direction in integers
		// Fish vertical determines whether the move is horizontal or vertical
		var distance = fish.type() * fish.movement();
		if (fish.isVertical()) {
			var newy = (y + distance + _gridy) % _gridy;
			position.y = newy;
		} else {
			var newx = (x + distance + _gridx) % _gridx;
			position.x = newx;
		}

		fish.move(); // Perform the internal move operation
		return position;
	};

	// Creates a new fish conceived at grid point x, y
	//
	// Inputs:
	//   x: the x coordinate where the fish is conceived
	//   y: the y coordinate there the fish is conceived
	var _birthFish = function (x, y) {

		// Find all the valid positions.
		//
		// Valid positions are in the 9-point stencil around the given point
		//   but do not include the point itself
		// Valid positions have no sharks.
		var positionPos = [];
		for (var i = -1; i < 1; i++) {
			for (var j = -1; j < 1; j++) {
				var tmpX = (x + i + _gridx) % _gridx;
				var tmpY = (y + i + _gridy) % _gridy;
				if (_grid[tmpY][tmpX].numSharks() === 0 &&
					(tmpX !== 0 || tmpY !== 0)) {
					positionPos.push({
						x: tmpX,
						y: tmpY
					});
				}
			}
		}

		// If there is no valid cell, do not birth fish
		if (positionPos.length < 1) {
			return;
		}

		// Get random position of the valid positions
		var idx = _getRandomInt(positionPos.length);

		// Get random direction
		var dir = _getRandomInt(2);
		var right = sharks.movement.RIGHT;
		if (dir === 0) {
			right = sharks.movement.LEFT;
		}

		// Add fish to chosen position
		_addToCell(positionPos[idx].x, positionPos[idx].y,
			makeFish(sharks.animal.FISH, right));
	}

	// Run one timestep of the simulation, moving all of the fish
	// and handling any birth and death events.
	var _incrementTime = function () {
		// Create new grid for final solution
		var newGrid = _createGrid(_gridx, _gridy);

		// Move all fish to new location
		for (var i = 0; i < _gridy; i++) {
			for (var j = 0; j < _gridx; j++) {
				var cell = _grid[i][j];
				var fishList = cell.fish();
				for (var k = 0; k < fishList.length; k++) {
					var newPos = _moveFish(j, i, fishList[k]);
					newGrid[newPos.y][newPos.x].addFish(fishList[k]);
				}
				fishList = cell.sharks();
				for (var k = 0; k < fishList.length; k++) {
					var newPos = _moveFish(j, i, fishList[k]);
					newGrid[newPos.y][newPos.x].addFish(fishList[k]);
				}
			}
		}
		_grid = newGrid;

		// Handle deaths and births
		// - sharks never die but eat all fish in their cell before
		//   they can give birth
		// - if there are two or more fish in a cell, they give birth
		//   to 1 fish at a randomly chosen adjacent cell that does not
		//   have a shark. The new fish has randomly chosen movement.
		for (var i = 0; i < _gridy; i++) {
			for (var j = 0; j < _gridx; j++) {
				if (_grid[i][j].numSharks() > 0) {
					_grid[i][j].eatAllFish();
				}

				if (newGrid[i][j].numFish() >= 2 && newGrid[i][j].numFish() < 10) {
					_birthFish(i, j);
				}
			}
		}
	};

	return {
		// Increment time in the simulation
		increment: function () {
			_incrementTime();
			_observers.notify();
		},

		// Returns the size of the current grid
		getGridSize: function () {
			return {
				x: _gridx,
				y: _gridy
			};
		},

		// Returns an object containing the number
		// of fish and the number of sharks in the
		// grid cell x, y
		getGridCellCounts: function (x, y) {
			return {
				fish: _grid[y][x].numFish(),
				sharks: _grid[y][x].numSharks()
			}
		},

		// Adds a fish to a given cell
		//
		// Inputs:
		//   x: x coordinate of cell where fish is added
		//   y: y coordinate of cell where fish is added
		//   type: fish or shark as defined by sharks.animal
		//   dir: direction fish moves in as defined by sharks.movement
		addFish: function (x, y, type, dir) {
			if (x < _gridx && y < _gridy) {
				_addToCell(x, y, makeFish(type, dir));
				_observers.notify();
			}
		},

		// Refreshes grid to an empty grid with dimensions x, y
		renewGrid: function (x, y) {
			_grid = _createGrid(x, y);
			_observers.notify();
		},

		// Register observer functions
		register: function (fxn) {
			_observers.add(fxn);
		},

		undo: function () {
			_observers.pop();
		}
	};
}

// Creates a Fish object of either type.
//
// Inputs:
//   animType: The type of animal as defined by sharks.animal
//   starMov: The movement direction as defined by sharks.movement
var makeFish = function (animType, startMov) {
	var _animalType = animType;
	var _vertical = true;
	var _movement = startMov;

	return {
		type: function () {
			return _animalType;
		},
		isVertical: function () {
			return _vertical;
		},
		movement: function () {
			return _movement;
		},

		move: function () {
			_vertical = !_vertical;
		}
	};
}

// Creates a Fish Cell object. This object represents the state of
// the cell in the grid.
var makeFishCell = function () {
	var _fish = [];
	var _sharks = [];

	return {
		fish: function () {
			return _fish;
		},
		sharks: function () {
			return _sharks;
		},
		numFish: function () {
			return _fish.length;
		},
		numSharks: function () {
			return _sharks.length;
		},
		addFish: function (fish) {
			if (fish.type() === sharks.animal.FISH) {
				_fish.push(fish);
			} else {
				_sharks.push(fish);
			}
		},
		eatAllFish: function () {
			_fish = [];
		}
	};
}

var makeGridView = function (model, divID) {
	var _div = document.getElementById(divID);

	var _cleanDiv = function () {
		while (_div.firstChild) {
			_div.removeChild(_div.firstChild);
		}
	}

	var _addRow = function () {
		var row = document.createElement('div');

		row.setAttribute('class', 'row');

		_div.appendChild(row);
		return row;
	}

	var _addCell = function (row, fish, sharks) {
		var cell = document.createElement('div');

		//cell.addEventListener("click", function (ev) { console.log("click...") })


		if (sharks > 0) {
			cell.setAttribute('class', 'cell shark');
			var text = document.createTextNode(sharks);
			cell.appendChild(text);
		} else if (fish > 0) {
			cell.setAttribute('class', 'cell fish');
			var text = document.createTextNode(fish);
			cell.appendChild(text);
		} else {
			cell.setAttribute('class', 'cell');
		}

		row.appendChild(cell);
	}

	return {
		render: function () {
			_cleanDiv();
			var gridSize = model.getGridSize();

			for (var i = 0; i < gridSize.y; i++) {
				var row = _addRow();
				for (var j = 0; j < gridSize.x; j++) {
					var contents = model.getGridCellCounts(j, i);
					_addCell(row, contents.fish, contents.sharks);
				}
			}
		}
	};
}

var makeControlsView = function (model, textID, enterID, movID) {
	var _movBtn = document.getElementById(movID);
	var _enterBtn = document.getElementById(enterID);
	var _enterRow = document.getElementById("row");
	var _enterCol = document.getElementById("col");
	var _observers = makeSignaller();
	var animals = document.getElementById("animals");
	var animalRowSelector = document.getElementsByClassName("animalRowSelector")[0];
	var animalColSelector = document.getElementsByClassName("animalColSelector")[0];
	var _addAnimal = document.getElementById("addAnimal");
	var fishSelector = document.getElementById("fishRadio");
	var sharkSelector = document.getElementById("sharkRadio");
	var rightSelector = document.getElementById("rightRadio");
	var leftSelector = document.getElementById("leftRadio");
	var animalType;
	var direction;

	var _getTypeDire = function () {
		fishSelector.addEventListener("click", function () {
			sharkSelector.checked = false;
			fishSelector.checked = true;
			animalType = "FISH";
		});
		sharkSelector.addEventListener("click", function (ev) {
			fishSelector.checked = false;
			sharkSelector.checked = true;
			animalType = "SHARK";
		});

		rightSelector.addEventListener("click", function () {
			rightSelector.clicked = true;
			leftSelector.checked = false;
			direction = "RIGHT";
		});
		leftSelector.addEventListener("click", function () {
			leftSelector.clicked = true;
			rightSelector.checked = false;
			direction = "LEFT";
		})
	}

	//this function is for disable controls of Animal section if
	//a valid grid does not be generated
	var _disableControls = function () {
		fishSelector.disabled = true;
		sharkSelector.disabled = true;
		rightSelector.disabled = true;
		leftSelector.disabled = true;
		animalRowSelector.disabled = true;
		animalColSelector.disabled = true;
		_addAnimal.disabled = true;
		_movBtn.disabled = true;
		animals.className = "disabled";
	}

	_disableControls();
	_getTypeDire();


	var _fireIncrementEvent = function () {
		_observers.notify({
			type: sharks.signal.increment
		})
	};

	var _fireEnterEvent = function () {
		//this function is for available all controls
		_enableControls = function () {
			fishSelector.disabled = false;
			sharkSelector.disabled = false;
			rightSelector.disabled = false;
			leftSelector.disabled = false;
			animalRowSelector.disabled = false;
			animalColSelector.disabled = false;
			_addAnimal.disabled = false;
			_movBtn.disabled = false;
			animals.className = "";
		}
		_enableControls();
		_observers.notify({
			type: sharks.signal.add,
			//command: _enterText.value,
			row: _enterRow.value,
			col: _enterCol.value,
		})
	};

	var _fireAddAnimal = function () {
		_observers.notify({
			xPlacement: parseInt(animalRowSelector[animalRowSelector.selectedIndex].value),
			yPlacement: parseInt(animalColSelector[animalColSelector.selectedIndex].value),
			type: sharks.signal.addAnimal,
			animalType: animalType,
			direction: direction,
			boxes: document.getElementsByClassName("cell"),
		})
	}

	_movBtn.addEventListener('click', _fireIncrementEvent);
	_enterBtn.addEventListener('click', _fireEnterEvent);
	_addAnimal.addEventListener("click", _fireAddAnimal);


	return {
		render: function () {
			//clear input value
			_enterCol.value = "";
			_enterRow.value = "";
		},

		register: function (fxn) {
			_observers.add(fxn);
		}

	};
}

var makeController = function (model) {

	var animalRowSelector = document.getElementsByClassName("animalRowSelector")[0];
	var animalColSelector = document.getElementsByClassName("animalColSelector")[0];
	//get the Action los element
	var _log = document.getElementsByClassName("history")[0];

	var _increment = function () {
		model.increment();
	};

	var _add = function (evt) {

		var rowCol = [evt.row, evt.col];

		var _clear = function () {
			while (animalRowSelector.firstChild) {
				animalRowSelector.removeChild(animalRowSelector.firstChild);
			};
			while (animalColSelector.firstChild) {
				animalColSelector.removeChild(animalColSelector.firstChild);
			};
		}
		_clear();

		if (rowCol[0] > 0 && rowCol[0] < 11 && rowCol[1] > 0 && rowCol[1] < 11) {

			_animalPlacement(rowCol);
			_renewGrid(rowCol);
		} else {
			_log.innerHTML = "Please input a valid size of grid, the size must be " +
				"within 10 by 10." + "<br /><br />" + _log.innerHTML;
		}


		return;
	};

	var _animalPlacement = function (rowCol) {
		var row = rowCol[0];
		var col = rowCol[1];

		for (var i = 0; i < row; i++) {
			var option = document.createElement("option");
			option.innerHTML = i;
			animalRowSelector.appendChild(option);

		}

		for (var i = 0; i < col; i++) {
			var option = document.createElement("option");
			option.innerHTML = i;
			animalColSelector.appendChild(option);
		}


	}

	var _renewGrid = function (args) {

		var _row = parseInt(args[0]);
		var _col = parseInt(args[1]);

		_log.innerHTML = "You are creating a " + _row + " rows and " + _col + " cols of grid." + "<br /><br/>" +
			_log.innerHTML;

		model.renewGrid(_row, _col);
	};

	var _createFish = function (args) {

		var x = args.xPlacement;
		var y = args.yPlacement;
		var animal = args.animalType //args[2].toUpperCase();
		var direction = args.direction //args[3].toUpperCase();
		console.log("preparing add " + animal + " to row: " + x + " col: " + y);
		var animalType = undefined;

		if (animal === 'FISH') {
			animalType = sharks.animal.FISH;
		} else if (animal === 'SHARK') {
			animalType = sharks.animal.SHARK;
		}

		var movement = undefined;
		if (direction === 'RIGHT') {
			movement = sharks.movement.RIGHT;
		} else if (direction === 'LEFT') {
			movement = sharks.movement.LEFT;
		}

		if (animalType === undefined || movement === undefined ||
			!Number.isInteger(x) || !Number.isInteger(y)) {
			console.log('Bad Command.');
			return;
		}

		_log.innerHTML = "You are adding a " + animal + " at " + x + " row and " + y + " col" + " with " +
			direction + " direction." + "<br /><br/>" + _log.innerHTML

		model.addFish(x, y, animalType, movement);
	};

	return {
		dispatch: function (evt) {
			console.log(evt)
			switch (evt.type) {
				case sharks.signal.increment:
					_increment();
					break;
				case sharks.signal.add:
					_add(evt);
					break;

				case sharks.signal.addAnimal:
					_createFish(evt);
					break;
				default:
					console.log('Unknown Event Type: ', evt);
			}
		}
	};
}