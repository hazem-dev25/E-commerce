import { Injectable } from "@nestjs/common";
import { Model, PopulateOptions } from "mongoose";



type Select = string | Record<string, 0 | 1>;
type Sort = string | Record<string, 1 | -1>;

@Injectable()
export class DatabaseRepository<TRowDocs> {
    public model: Model<TRowDocs>;

    constructor(model: Model<TRowDocs>) {
        this.model = model;
    }

    create(data: Partial<TRowDocs>): Promise<TRowDocs> {
        return this.model.create(data);
    }

    insertMany(data: Partial<TRowDocs>[]) {
        return this.model.insertMany(data);
    }

    find(
        filter: Partial<any> = {},
        select?: Select,
        populate?: PopulateOptions | PopulateOptions[],
        sort?: Sort,
        limit?: number,
        skip?: number
    ) {
        let docs = this.model.find(filter);

        if (select) {
            docs = docs.select(select);
        }

        if (populate) {
            docs = docs.populate(populate);
        }

        if (sort) {
            docs = docs.sort(sort);
        }

        if (typeof skip === "number") {
            docs = docs.skip(skip);
        }

        if (typeof limit === "number") {
            docs = docs.limit(limit);
        }

        return docs;
    }

    findOne(
        filter: any,
        select?: Select,
        populate?: PopulateOptions | PopulateOptions[],
        sort?: Sort
    ) {
        let doc = this.model.findOne(filter);

        if (select) {
            doc = doc.select(select);
        }

        if (populate) {
            doc = doc.populate(populate);
        }

        if (sort) {
            doc = doc.sort(sort);
        }

        return doc;
    }

    findById(
        id: string,
        select?: Select,
        populate?: PopulateOptions | PopulateOptions[]
    ) {
        let doc = this.model.findById(id);

        if (select) {
            doc = doc.select(select);
        }

        if (populate) {
            doc = doc.populate(populate);
        }

        return doc;
    }

    findByIdAndUpdate(
        id: string,
        data: any,
        select?: Select,
        populate?: PopulateOptions | PopulateOptions[]
    ) {
        let doc = this.model.findByIdAndUpdate(id, data, { after: true });

        if (select) {
            doc = doc.select(select);
        }

        if (populate) {
            doc = doc.populate(populate);
        }

        return doc;
    }

    findByIdAndDelete(
        id: string,
        select?: Select,
        populate?: PopulateOptions | PopulateOptions[]
    ) {
        let doc = this.model.findByIdAndDelete(id);

        if (select) {
            doc = doc.select(select);
        }

        if (populate) {
            doc = doc.populate(populate);
        }

        return doc;
    }
}
