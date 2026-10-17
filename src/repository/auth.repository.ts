import { iAuth } from "common/interface/auth.interface";
import { DatabaseRepository } from "./database.repository";
import { InjectModel } from "@nestjs/mongoose";
import { Auth } from "model/auth.model";
import { Model } from "mongoose";
import { Injectable } from "@nestjs/common";


@Injectable()
export class AuthRepository extends DatabaseRepository<iAuth>{

    constructor(@InjectModel(Auth.name) public readonly model:Model<iAuth>){
        super(model)
    }
}