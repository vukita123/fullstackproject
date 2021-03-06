import "reflect-metadata";
import{MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import microConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer} from "apollo-server-express";
import { buildSchema  } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";
import { appendFile } from "fs";
import { MyContext } from "./types";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";



const main = async () => {
    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up();

    const app = express();

    const RedisStore = connectRedis(session);
    const redisClient = redis.createClient();

    app.use(
        cors({
          credentials: true,
          origin: "https://studio.apollographql.com",
        })
      );

    app.use(
        session({
            name: "qid",
            store: new RedisStore({
                client: redisClient,
                disableTouch: true
            }),
            cookie:{
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
                httpOnly: true,
                sameSite: 'lax',
                secure: __prod__ //cookie only works in https
            },
            saveUninitialized: false,
            secret: "asnkdjvnasjaksklasdf",
            resave: false,
        // Access-Control-Allow-Origin: https://studio.apollographql.com,
        // Access-Control-Allow-Credentials: true
        })
    )

    const { ApolloServerPluginLandingPageGraphQLPlayground } = require('apollo-server-core');

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver] ,
            validate: false,
        }),
        //credentials: include,
        plugins: [
            ApolloServerPluginLandingPageGraphQLPlayground({
              // options
              //'request.credentials': 'include'
            })
        ],
        context: ({ res, req }) => ({ em: orm.em, res, req})
    })
    await apolloServer.start();
    apolloServer.applyMiddleware({ app }); 

    app.get("/",(_,res)=>{
        res.send("hello world");
    })



    app.listen(4000,() => {
        console.log("server started on localhost:4000");
    })
};
main().catch((err) =>{
    console.error(err);
});


console.log("hello world")

function cors(arg0: { credentials: boolean; origin: string; }): any {
    throw new Error("Function not implemented.");
}
