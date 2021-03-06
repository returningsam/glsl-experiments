const mat2 m2 = mat2(0.8,-0.6,0.6,0.8);
float fbm( in vec2 p ){
    float f = 0.0;
    f += 0.5000*noise( p ); p = m2*p*2.02;
    f += 0.2500*noise( p ); p = m2*p*2.03;
    f += 0.1250*noise( p ); p = m2*p*2.01;
    f += 0.0625*noise( p );

    return f/0.9375;
}

const mat2 m2 = mat2(0.8,-0.6,0.6,0.8);
float fbm( in vec3 p ){
    float f = 0.0;
    f += 0.5000*noise( p ); p.xy = m2*p.xy*2.02;
    f += 0.2500*noise( p ); p.xy = m2*p.xy*2.03;
    f += 0.1250*noise( p ); p.xy = m2*p.xy*2.01;
    f += 0.0625*noise( p );

    return f/0.9375;
}

const mat3 m3 = mat3(0.8,-0.6,0.6,0.8,0.8,-0.6,0.6,0.8,-0.6);
float fbm( in vec4 p ){
    float f = 0.0;
    f += 0.5000*noise( p ); p = m3*p.xyz*2.02;
    f += 0.2500*noise( p ); p = m3*p.xyz*2.03;
    f += 0.1250*noise( p ); p = m3*p.xyz*2.01;
    f += 0.0625*noise( p );

    return f/0.9375;
}
