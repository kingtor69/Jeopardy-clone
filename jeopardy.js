class Game {

    constructor() {
        this.board = [];
    }

    async playGame() {
        this.showLoadingView();
        const categoryIds = await this.getCategoryIds();
        const categories = [];
        for (let catId of categoryIds) {
            categories.push(await this.getCategory(catId));
        };
        await this.buildBoard(categories);
        this.hideLoadingView();
        await this.fillHtmlTable();
    }

    async getCategoryIds() {
        const categoryIds = [];
        const offset = Math.floor(Math.random() * 100) * 100;
        try {
            const herdOfCats = await axios.get(`https://jservice.io/api/categories?count=100&offset=${offset}`);
            for (let i = 0; i < 6;) {
                const catId = herdOfCats.data[Math.floor(Math.random() * 100)].id;
                if (!categoryIds.includes(catId)) {
                    categoryIds.push(catId);
                    i++;
                }
            }
            return categoryIds;
        } catch (err) {
            this.displayError(err);
        }
    }

    displayError(err) {
        alert(`Something went wrong. It's me, not you. Try a new game. ${err}`);
    }

    async replaceFalsyCategory(categories) {
        // get a new offset between 1st and 9,999th
        const offset = Math.floor(Math.random() * 10000);
        // get the category at that offset
        const probyCat = await axios.get(`https://jservice.io/api/categories?offset=${offset}`);
        for (let i = 0; i < categories.length; i++) {
            if (probyCat.data.id === categories[i].data.id) {
                this.replaceFalsyCategory(categories);
            }
            if (!categories[i]) {
                categories.slice(categories[i], 1, probyCat);
            }
        }
        return categories;
    };

    async getCategory(catId) {
        const category = await axios.get(`https://jservice.io/api/category?id=${catId}`);
        return category;
    }

    buildBoard(categories) {
        this.board = [];
        let c = 0;
        for (let category of categories) {
            const clues = this.get5Clues(category);
            if (!clues) {
                this.replaceFalsyCategory(categories);
            }
            let objeeDuLoupe = { category };
            objeeDuLoupe[c] = clues;
            this.board.push(objeeDuLoupe);
            c++;
        }
    }

    get5Clues(category) {
        const chosenClues = [];
        let availableClues = [];
        for (let clue of category.data.clues) {
            availableClues.push(clue);
        }
        while (chosenClues.length < 5) {
            if (availableClues.length > 0) {
                let index = Math.floor(Math.random() * (availableClues.length));
                if (availableClues[index]) {
                    chosenClues.push(availableClues[index]);
                    availableClues.splice(index, 1);
                }
            } else {
                return null;
            }
        }
        return chosenClues;
    }

    fillHtmlTable() {
        // if I can figure out a way to have these load randomly every 100ms or so
        // and change their classess as they do
        // THAT would be badass
        for (let c = 0; c < this.board.length; c++) {
            const $catC = $(`#${c}`);
            $catC.text(this.board[c].category.data.title);
        };
        const $tds = $('td');
        $tds.text('???');
        $tds.addClass('blank');
    }

    handleClick(evt) {
        const clickedId = evt.path[0].id;
        const $clickedTd = $(`#${clickedId}`);
        const clickedClass = $clickedTd.attr('class');
        const categoryNum = clickedId[0];
        const answerNum = clickedId[2];
        if (clickedClass.includes("questioned")) {
            $clickedTd.html(this.board[categoryNum].category.data.clues[answerNum].answer);
            $clickedTd.addClass('answered');
            return;
        } else if (clickedClass.includes("answered")) {
            return;
        } else {
            $clickedTd.html(this.board[categoryNum].category.data.clues[answerNum].question);
            $clickedTd.addClass('questioned');
            return;
        }
    }

    showLoadingView() {
        $('th').removeClass('loaded');
        $('td').removeClass('loaded');
        $('button').removeClass('loaded');
        $('td').text('loading...');
    }

    hideLoadingView() {
        $('th').addClass('loaded');
        $('td').addClass('loaded');
        $('button').addClass('loaded');
    }

};

function start() {
    const body = document.querySelector('body');
    const h1 = document.createElement('h1');
    h1.innerText = "Jeopardy!";
    const gameSection = document.createElement('section');
    gameSection.id = "game-container";
    const gameBoardDiv = document.createElement('div');
    gameBoardDiv.id = "game-board-div";
    const newGameButton = document.createElement('button');
    newGameButton.id = "new-game-button";
    newGameButton.innerText = "Start New Game";
    body.appendChild(h1);
    body.appendChild(gameSection);
    gameSection.appendChild(gameBoardDiv);
    gameSection.appendChild(newGameButton);
    createHtmlBoard();
};

function createHtmlBoard() {
    const gameBoardDiv = document.querySelector('#game-board-div');
    const gameTable = document.createElement('table');
    gameTable.id = "game-table"

    const tableHead = document.createElement('thead');
    tableHead.id = "board-table-head";
    gameBoardDiv.appendChild(tableHead);
    const tr = document.createElement('tr');
    tableHead.appendChild(tr);
    for (let col = 0; col < 6; col++) {
        const th = document.createElement('th');
        th.id = [col];
        tr.appendChild(th);
    };

    const tableBody = document.createElement('tbody');
    tableBody.id = "game-table-board";
    gameBoardDiv.appendChild(tableBody);
    for (let row = 0; row < 5; row++) {
        const bodyTr = document.createElement('tr');
        tableBody.appendChild(bodyTr);
        for (let col = 0; col < 6; col++) {
            const td = document.createElement('td');
            td.id = `${col}-${row}`
            bodyTr.appendChild(td)
        }
    }
    
    gameBoardDiv.appendChild(gameTable);
};

start();

const catBtns = document.querySelectorAll('th');
const gameBtns = document.querySelectorAll('td');
const newGameButton = document.querySelector('#new-game-button');

for (let button of catBtns) {
    button.addEventListener('click', function(evt) {
        GameOn.handleClick(evt);
    })
}
for (let button of gameBtns) {
    button.addEventListener('click', function(evt) {
        GameOn.handleClick(evt);
    })
}
newGameButton.addEventListener('click', function() {
    GameOn = new Game;
    GameOn.playGame();
});

let GameOn = new Game;
GameOn.playGame();