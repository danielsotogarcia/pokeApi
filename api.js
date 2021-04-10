const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");

const api = express();

// CONFIGURACION: CORS
api.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');

    // authorized headers for preflight requests
    // https://developer.mozilla.org/en-US/docs/Glossary/preflight_request
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();

    api.options('*', (req, res) => {
        // allowed XHR methods  
        res.header('Access-Control-Allow-Methods', 'GET, PATCH, PUT, POST, DELETE, OPTIONS');
        res.send();
    });
});

// CONF DECODE BODYPARSER
api.use(bodyParser.json()); // necesario para parseo de string json
api.use(bodyParser.urlencoded({ extended: true })); //Decodificamos la informacion del body

// GET
api.get("/api/pokemons", (request, response) => {
    fs.readFile("db/dbPokemon.json", (err, data) => {
        if (err) throw err; // Elevar o notificar una excepcion
        const allPokemons = JSON.parse(data); // Parseamos el contenido del fichero a formato JSON
        response.status(200).send({
            success: true,
            url: "/api/pokemons",
            method: "GET",
            pokemons: allPokemons
        });
    });
});

// POST por parametros "api/pokemons?name=pikachu&type=electrico
api.post("/api/pokemons", (request, response) => {

    if (!request.body.name || !request.body.type) {
        response.status(400).send({
            success: false,
            url: "/api/pokemons",
            method: "POST",
            message: "name and type is required"
        });
    } else {
        fs.readFile("db/dbPokemon.json", (err, data) => {

            const allPokemons = JSON.parse(data);

            const newPokemon = {
                id: allPokemons.length + 1,
                name: request.body.name,
                type: request.body.type
            };

            allPokemons.push(newPokemon);

            fs.writeFile("db/dbPokemon.json", JSON.stringify(allPokemons), (err) => {
                if (err) {
                    response.status(400).send({
                        success: false,
                        url: "/api/pokemons",
                        method: "POST",
                        message: "fallo al añadir el pokemon",
                        err: err
                    });
                } else {
                    response.status(201).send({
                        success: true,
                        url: "/api/pokemons",
                        method: "POST",
                        message: "pokemon añadido correctamente",
                        newPokemon: newPokemon
                    });
                }
            });

        });
    }
});

// DELETE
api.delete("/api/pokemons", (request, response) => {
    if (!request.body.id) {
        response.status(400).send({
            success: false,
            url: "/api/pokemons",
            method: "DELETE",
            message: "id is required"
        });
    } else {

        fs.readFile("db/dbPokemon.json", (err, data) => {

            const allPokemon = JSON.parse(data);

            const deletePokemon = {
                id: Number.parseInt(request.body.id)
            };

            const newAllPokemon = allPokemon.filter(
                pokemon => pokemon.id !== deletePokemon.id
            );

            fs.writeFile("db/dbPokemon.json", JSON.stringify(newAllPokemon), (err) => {
                if (err) {
                    response.status(400).send({
                        success: false,
                        url: "/api/pokemons",
                        method: "DELETE",
                        message: "fallo al borrar el pokemon",
                        err: err
                    });
                } else {
                    response.status(200).send({
                        success: true,
                        url: "/api/pokemons",
                        method: "DELETE",
                        message: "pokemon borrado correctamente",
                        deletePokemon: deletePokemon
                    });
                }

            });

        });
    }

});

// GET ONE BY QUERY STRING
api.get("/api/onepokemon", (request, response) => {
    if (!request.query.id) {
        response.status(400).send({
            success: false,
            url: "/api/onepokemon",
            method: "GET",
            message: "id is required"
        });
    } else {
        fs.readFile("db/dbPokemon.json", (err, data) => {
            if (err) {
                response.status(400).send({
                    success: false,
                    url: "/api/onepokemon",
                    method: "GET",
                    err: err
                });
            } else {
                const allPokemons = JSON.parse(data);
                //Conseguir el pokemon que se nos pide
                onePokemon = allPokemons.find(
                    pokemon => pokemon.id === Number.parseInt(request.query.id)
                );
                response.status(201).send({
                    success: true,
                    url: "/api/onepokemons",
                    method: "GET",
                    message: "pokemon encontrado correctamente",
                    pokemon: onePokemon
                });
            }
        });
    }

});

//GET ONE BY PARAMS
api.get("/api/pokemons/:id", (request, response) => {
    const idPokemon = request.params.id;
    fs.readFile("db/dbPokemon.json", (err, data) => {
        const allPokemon = JSON.parse(data);

        const pokemon = allPokemon.find(
            pokemon => pokemon.id === Number.parseInt(idPokemon)
        );

        response.status(200).send({
            success: true,
            url: "/api/pokemons",
            method: "GET",
            message: "pokemon encontrado correctamente",
            pokemon: pokemon
        });
    });
});

// PUT
api.put("/api/pokemons/:id", (request, response) => {

    fs.readFile("db/dbPokemon.json", (err, data) => {
        if (err) throw err;

        const allPokemonsUpdate = JSON.parse(data);

        allPokemonsUpdate.forEach(pokemon => {
            if (pokemon.id === Number.parseInt(request.params.id)) {

                pokemon.type = request.body.type ? request.body.type : pokemon.type;
                pokemon.name = request.body.name ? request.body.name : pokemon.name;
            }
        });

        fs.writeFile("db/dbPokemon.json", JSON.stringify(allPokemonsUpdate), (err) => {

            if (err) throw err;

            response.status(200).send({
                success: true,
                url: "/api/pokemons",
                method: "PUT",
                message: "pokemon modificado correctamente",
                pokemon: request.params.id
            });
        });

    });

});

// PAGINADO
api.get("/api/pokemons/page/:page", (request, response) => {

    fs.readFile("db/dbPokemon.json", (err, data) => {
        // Conseguir devolver los items segun la pagina que se solicite
        // Cada pagina debe contener 5 pokemons

        const allPokemons = JSON.parse(data);

        const PAGE_SIZE = 5;

        const numPages = Math.round(allPokemons.length / PAGE_SIZE);
        const page = request.params.page;
        const initPage = (page * PAGE_SIZE) - PAGE_SIZE;
        const endPage = page * PAGE_SIZE;

        const pagePokemons = allPokemons.slice(initPage, endPage);

        response.status(200).send({
            success: 'true',
            message: 'Pokedex Paginada',
            page: page,
            numPages: numPages,
            pokemons: pagePokemons
        });
    });
});

// PAGINADO OFFSET AND LIMIT
api.get("/api/pageoffset/pokemons", (request, response) => {
    fs.readFile("db/dbPokemon.json", (err, data) => {
        const allPokemons = JSON.parse(data);

        const limit = parseInt(request.query.limit);
        const offset = parseInt(request.query.offset);

        const pagePokemons = allPokemons.slice(offset, offset + limit);

        response.status(200).send({
            success: 'true',
            message: 'Pokedex offset',
            pokemons: pagePokemons
        });
    });
});

// GET SUB RECURSOS
api.get('/api/pokemons/:pokemonId/locations/:locationId', (req, res) => {
    fs.readFile("db/dbPokemon.json", (error, data) => {
        const allPokemons = JSON.parse(data);

        const pokemon = allPokemons.find(
            pokemon => pokemon.id === parseInt(req.params.pokemonId)
        );

        if (pokemon) {
            const location = pokemon.locations.find(
                location => location.id === parseInt(req.params.locationId)
            );

            if (location) {
                return res.status(200).send({
                    success: 'true',
                    message: 'Pokemon Location',
                    pokemon: pokemon.id,
                    location: location
                });
            } else {
                return res.status(400).send({
                    success: 'true',
                    message: 'Pokemon Location Not Found',
                });
            }
        } else {
            return res.status(400).send({
                success: 'true',
                message: 'Pokemon Not Found',
            });
        }
    });
});

const PORT = process.env.PORT || 1010;
api.listen(PORT, () => {
    console.log(`POKEAPI corriendo en puerto ${PORT}`);
});