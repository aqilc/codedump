

  // Collisions to do if the player is perfectly on the block
  if (pbax == player.x && pbay == player.y) {
		char block = getblock(pbx, pby);
    if(block == 1) {
    	if(!getblock(pbx - 1, pby)) player.x = (pbx - 1) * blocksize;
    	else if(!getblock(pbx, pby - 1)) player.y = (pby - 1) * blocksize;
    	else if(!getblock(pbx + 1, pby)) player.x = (pbx + 1) * blocksize;
    	else if(!getblock(pbx, pby + 1)) player.y = (pby + 1) * blocksize;
    	else killplayer();
    }
  } else {

  	// Each corresponds to a corner of the player sprite
    char pc1 = getblock(pbx, pby), pc2 = getblock((player.x + player.w) / blocksize, pby), pc3 = getblock(pbx, (player.y + player.h) / blocksize), pc4 = getblock((player.x + player.w) / blocksize, (player.y + player.h) / blocksize);
    bool horiz = abs(player.vx) > abs(player.vy) || player.vy == player.vx ? abs(player.x - pbax) > abs(player.y - pbay) : false;
    
    // bool horiz = abs(player.x - pbax) > abs(player.y - pbay);
    if (pc1 == 1) {
      if(horiz) player.x = pbax + blocksize;
  		else player.y = pbay + blocksize;
    }
    if(pc2 == 1) {
  		if(horiz) player.x = pbax + blocksize - player.w;
  		else player.y = pbay + blocksize;
  	}
  	if(pc3 == 1) {
  		if(horiz) player.x = pbax + blocksize;
  		else player.y = pbay + blocksize - player.h;
  	}
  	if(pc4 == 1) {
  		if(horiz) player.x = pbax + blocksize - player.h;
  		else player.y = pbay + blocksize - player.h;
  	}
  }
