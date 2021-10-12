import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { User } from "../entities/User";
import { MyContext } from "../types";
import {argon2} from "argon2";

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
    @Mutation(() => User)
    async register(
        @Arg('options' , () => UsernamePasswordInput) options: UsernamePasswordInput,
        @Ctx() {em}: MyContext
    ){
        //const hashedPassword = await argon2.hash(options.password);
        const user = em.create(User, {username: options.username, password: options.password});
        await em.persistAndFlush( user);
        return user;
    }

    @Mutation(() => UserResponse)
    async login( 
        @Arg('options' , () => UsernamePasswordInput) options: UsernamePasswordInput,
        @Ctx() {em}: MyContext
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
        if(!(user.password == options.password){
            errors: [{
                field: 'username',
                message: "incorrect password"
            },
            ]
        })
        return{
            user,
        }
    }
   
}