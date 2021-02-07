const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");

const api = express();

// CONF CORS

// CONF DECODE BODYPARSER
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
        //-1 creamos el nuevo pokemon obteniendo los datos de "request.query"
        //-2 conseguismos el array
        //-3 pusheamos el objeto en el array
        //-4 introducimos el array con el nuevo item, parseando el array con JSON.stringify(array)
        //-5 si todo ha ido bien respondemos con un mensaje de OK

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

//DELETE
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
                    response.status(204).send({
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

// GET ONE
api.get("/api/onepokemon", (request, repsonse) => {
    if (!request.query.id) { // o request.body.id
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
                const allPokemon = JSON.parse(data);
                //Conseguir el pokemon que se nos pide
                onePokemon = allPokemons.filter(
                    pokemon => pokemon.id === Number.parseInt(req.query.id)
                );
                response.status(201).send({
                    success: true,
                    url: "/api/onepokemons",
                    method: "GET",
                    message: "pokemon encontrado correctamente",
                    pokemon: onePokemon[0]
                });
            }
        });
    }

});


//api/pokemons/pk_001
api.get("/api/pokemons/:id", (request, response) => {
    const idPokemon = request.params.id;
    fs.readFile("db/dbPokemon.json", (err, data) => {
        const allPokemon = JSON.parse(data);

        const pokemon = allPokemon.find(
            pokemon => pokemon.id === Number.parseInt(request.params.id)
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
                /*if (request.body.type)
                    pokemon.type = request.body.type;*/

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

//PAGINADO
api.get("/api/pokemons/page/:page", (request, response) => {

    fs.readFile("db/dbPokemon.json", (err, data) => {
        // Conseguir devolver los items segun la pagina que se solicite
        // Cada pagina debe contener 5 pokemons

        const allPokemons = JSON.parse(data);

        const PAGE_SIZE = 5;

        const page = request.params.page;
        const initPage = (page * PAGE_SIZE) - PAGE_SIZE;
        const endPage = page * PAGE_SIZE

        const pagePokemons = allPokemons.slice(initPage, endPage);

        response.status(200).send({
            success: 'true',
            message: 'Pokedex Paginada',
            page: page,
            // numPages: numPages,
            pokemons: pagePokemons
        });
    });
});


//PAGINADO
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

// GET LOCATIONS
app.get('/api/pokemons/:pokemonId/locations/:locationId', (req, res) => {
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

api.listen(1010, () => {
    console.log("POKEAPI corriendo en puerto 1010");
});