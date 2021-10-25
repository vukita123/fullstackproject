import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { User } from "../entities/User";
import { MyContext } from "../types";
import {argon2} from "argon2";
import { formatApolloErrors } from "apollo-server-errors";

@InputType()//basically an object
class UsernamePasswordInput{
    @Field()
    username: string
    @Field()
    password: string
}

@ObjectType()
class FieldError{
    @Field ()
    field: string

    @Field()
    message: string
}

@ObjectType()
class UserResponse{
    @Field( () => [FieldError], {nullable: true})
    errors?: FieldError[]

    @Field( () => User, {nullable: true})
    user?: User
}

@Resolver()
export class UserResolver{
    @Mutation(() => UserResponse)
    async register(
        @Arg('options' , () => UsernamePasswordInput) options: UsernamePasswordInput,
        @Ctx() {em}: MyContext
    ): Promise<UserResponse>{
        if (options.username.length <= 2){
            return{
                errors: [{
                     field: "username",
                     message: "length can't be shorter than 2"

                }]
            }
        }
        if (options.password.length <= 2){
            return{
                errors: [{
                     field: "password",
                     message: "length must be longer than 2"

                }]
            }
        }
        //const hashedPassword = await argon2.hash(options.password);
        const user = em.create(User, {username: options.username, password: options.password});
        try{
            await em.persistAndFlush( user);
        } catch(err){
            if(err.code === "23505"){
                return{
                    errors:[
                        {
                        field: "username",
                        message: "username already taken"
                        }
                    ]
                }
            }
            //console.log("message: ", err.message );
        }
        return {user};
    }

    @Mutation(() => UserResponse)
    async login( 
        @Arg('options' , () => UsernamePasswordInput) options: UsernamePasswordInput,
        @Ctx() {em, req}: MyContext
    ): Promise<UserResponse>{
        //const hashedPassword = await argon2.hash(options.password);
        const user = await em.findOne(User, {username: options.username})
        if(!user){
            return{
                errors: [{
                    field: 'username',
                    message: "That username doesn't exist"
                },
                ],
            };
        }
        if(!(user.password == options.password)){
            return{
            errors: [
                {
                field: 'username',
                message: "incorrect password"
                },
            ],
        }
    }

        req.session!.UserID = user.id;

        return{
            user,
        }
    }
   
}