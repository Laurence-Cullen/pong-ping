let app = new Vue({
    el: '#pong_ping',
    data: {
        newGame: {
            player1: null,
            player1Score: 0,
            player2: null,
            player2Score: 0,
        },
        predicate: 'elo',
        players: {},
        games: [],
        K: 32, // controls how fast ELOs change, in chess either 32 for noobs or 16 for masters
        victoryWords: {
            marginal: ['edged out', 'overcame', 'subdued'],
            low: ['beat', 'defeated', 'overpowered', 'subjugated'],
            medium: ['smoked', 'caned', 'beat down'],
            high: ['smashed', 'clobbered', 'thrashed', 'vanquished'],
            extreme: ['demolished', 'crushed', 'obliterated'],
            absolute: ['atomised', 'annihilated', 'massacred'],
            overkill: ['decimated'],
        }
    },
    computed: {
        sortedPlayers: function () {
            let playersArray = Object.values(this.players);
            let that = this;
            playersArray.sort(function (a, b) {
                return b[that.predicate] - a[that.predicate];
            });
            return playersArray;
        },
        sortedGames: function () {
            let games = this.games;

            let gamesToSort = [];

            for (const i in games) {
                const game = games[i];

                let winner = null;
                let loser = null;

                let winnerScore = null;
                let loserScore = null;

                if (Number(game.player1Score) > Number(game.player2Score)) {
                    winner = game.player1;
                    loser = game.player2;
                    winnerScore = game.player1Score;
                    loserScore = game.player2Score;

                } else if (Number(game.player2Score) > Number(game.player1Score)) {
                    winner = game.player2;
                    loser = game.player1;
                    winnerScore = game.player2Score;
                    loserScore = game.player1Score;

                } else {
                    console.log('players drew, not legal');
                    return
                }

                let scoreDelta = winnerScore - loserScore;

                let victorySeverity = null;
                if (scoreDelta <= 2) {
                    victorySeverity = 'marginal';
                } else if (scoreDelta <= 4) {
                    victorySeverity = 'low';
                } else if (scoreDelta <= 6) {
                    victorySeverity = 'medium';
                } else if (scoreDelta <= 8) {
                    victorySeverity = 'high';
                } else if (scoreDelta <= 10) {
                    victorySeverity = 'extreme';
                } else if (scoreDelta === 11) {
                    victorySeverity = 'absolute';
                } else if (scoreDelta > 11) {
                    victorySeverity = 'overkill'
                } else {
                    console.log('encountered error when computing victory severity');
                    return
                }

                const numberOfWords = this.victoryWords[victorySeverity].length;
                const victoryWord = this.victoryWords[victorySeverity][this.randomInt(0, numberOfWords)];

                gamesToSort.push({
                    winner: winner,
                    loser: loser,
                    winnerScore: winnerScore,
                    loserScore: loserScore,
                    victoryWord: victoryWord,
                    timeStamp: game.timeStamp
                })
            }

            return gamesToSort.sort(function (a, b) {
                return b.timeStamp.seconds - a.timeStamp.seconds;
            });
        }
    },
    methods: {
        randomInt: function (min, max) {
            //The maximum is exclusive and the minimum is inclusive
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min)) + min;
        },
        timeSince: function (timeStamp) {
            const seconds = firebase.firestore.Timestamp.now().seconds - timeStamp.seconds;

            let interval = Math.floor(seconds / 31536000);

            if (interval > 1) {
                return interval + " years";
            }
            interval = Math.floor(seconds / 2592000);
            if (interval > 1) {
                return interval + " months";
            }
            interval = Math.floor(seconds / 86400);
            if (interval > 1) {
                return interval + " days";
            }
            interval = Math.floor(seconds / 3600);
            if (interval > 1) {
                return interval + " hours";
            }
            interval = Math.floor(seconds / 60);
            if (interval > 1) {
                return interval + " minutes";
            }
            return Math.floor(seconds) + " seconds";
        },
        addGame: function (newGame) {
            if (newGame.player1Score < 11 && newGame.player2Score < 11) {
                alert('Game must be to a minimum of 11 points 🔴');
                return newGame;
            } else if (newGame.player1.name === newGame.player2.name) {
                alert('You just played yourself 👎');
                return newGame;
            } else if (newGame.player1Score === newGame.player2Score) {
                alert('No draws allowed!‍ 🔴\nPlay until a winner is decided.');
                return newGame
            }

            this.saveGame(newGame);

            const newElos = this.computeNewELOs(
                newGame.player1.elo,
                newGame.player1Score,
                newGame.player2.elo,
                newGame.player2Score
            );

            newGame.player1.elo = newElos.player1Elo;
            newGame.player2.elo = newElos.player2Elo;

            this.updateELO(newGame.player1.name, newElos.player1Elo);
            this.updateELO(newGame.player2.name, newElos.player2Elo);

            this.getGames();

            newGame.player1 = null;
            newGame.player2 = null;
            newGame.player1Score = 0;
            newGame.player2Score = 0;
        },
        saveGame: function (game) {
            console.log('attempting to save game');
            if (game.player1 == null || game.player2 == null) {
                console.log('found a null player in game');
                console.log(game.player1);
                console.log(game.player2);

                return game
            }

            if (game.player1Score < 11 && game.player2Score < 11) {
                console.log('game must be scored to at least 11 points to count');

                return game
            }

            // Add a new game in collection "games"
            let docRef = db.collection("games").add({
                player1: game.player1.name,
                player1Score: game.player1Score,
                player2: game.player2.name,
                player2Score: game.player2Score,
            })
                .then(function (docRef) {
                    console.log("Game added");

                    // Update the timestamp field with the value from the server
                    let updateTimestamp = docRef.update({
                        timeStamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                })
                .catch(function (error) {
                    console.error("Error writing game to firestore: ", error);
                });
        },
        getPlayers: function () {
            console.log('loading player data from the database');

            let that = this;

            db.collection("players").get().then(function (querySnapshot) {
                let players = {};
                querySnapshot.forEach(function (doc) {
                    players[doc.data().name] = {name: doc.data().name, elo: doc.data().elo};
                });
                that.players = players;
            });
            console.log('player data loaded');
        },

        getGames: function () {
            console.log('loading game data from the database');

            let that = this;

            db.collection("games").get().then(function (querySnapshot) {
                let games = [];
                querySnapshot.forEach(function (doc) {
                    games.push({
                        player1: doc.data().player1,
                        player1Score: doc.data().player1Score,
                        player2: doc.data().player2,
                        player2Score: doc.data().player2Score,
                        timeStamp: doc.data().timeStamp
                    });
                });
                that.games = games;
            });
            console.log('game data loaded');
        },

        // Implementing ELO score
        // https://en.wikipedia.org/wiki/Elo_rating_system
        computeNewELOs: function (player1Elo, player1Score, player2Elo, player2Score) {

            console.log('player1 elo:', player1Elo);
            console.log('player2 elo:', player2Elo);

            const expected_1 = this.computeExpectedScore(player1Elo, player2Elo);
            const expected_2 = this.computeExpectedScore(player2Elo, player1Elo);

            console.log('expected scores:');
            console.log(expected_1);
            console.log(expected_2);

            // normalise inputted scores
            const totalScore = Number(player1Score) + Number(player2Score);

            console.log('total score:', totalScore);

            const actual_1 = player1Score / totalScore;
            const actual_2 = player2Score / totalScore;

            console.log('actual scores:');
            console.log(actual_1);
            console.log(actual_2);

            const player1EloUpdated = player1Elo + this.K * (actual_1 - expected_1);
            const player2EloUpdated = player2Elo + this.K * (actual_2 - expected_2);

            return {player1Elo: player1EloUpdated, player2Elo: player2EloUpdated}
        },
        updateELO: function (playerName, newELO) {
            // Update Player ELO score
            db.collection("players").doc(playerName).set({
                name: playerName,
                elo: newELO
            })
                .then(function () {
                    console.log("Player", playerName, "elo rating updated");
                })
                .catch(function (error) {
                    console.error("Error writing document: ", error);
                });
        },
        computeExpectedScore: function (player_elo, other_elo) {
            return 1 / (1 + Math.pow(10, (other_elo - player_elo) / 400));
        }
    }
});