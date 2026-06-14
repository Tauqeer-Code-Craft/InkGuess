import { Controller, Get, NotFoundException, Param, Post } from "@nestjs/common";
import { GameService } from "./game.service";

@Controller('api/rooms')
export class RoomController{
    constructor(private readonly gameService: GameService){}

    @Post()
    async createRoom(){
        const roomCode = await this.gameService.createRoom();
        return {roomCode}
    }

    @Get('check/:code') 
    async checkRoom(@Param('code') code: string){
        const uppercaseCode = code.toUpperCase();
        const exists = await this.gameService.roomExists(uppercaseCode);
        return {exists, code:uppercaseCode}
    }

    @Get(':code')
    async getRoom(@Param('code') code: string){
        const uppercaseCode = code.toUpperCase();
        const room = await this.gameService.getRoomState(uppercaseCode);
        if(!room){
            throw new NotFoundException(`Room ${uppercaseCode} not found`);
        }
        return room;
    }
}