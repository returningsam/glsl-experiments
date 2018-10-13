vec2 rotateAroundPoint(vec2 point, vec2 center, float angle) {
    float x = center.x + (point.x-center.x)*cos(angle) - (point.y-center.y)*sin(angle);
    float y = center.y + (point.x-center.x)*sin(angle) + (point.y-center.y)*cos(angle);
    return vec2(x,y);
}

vec3 rotateAroundPoint3d(vec3 point, float angleX, float angleY, float angleZ) {
    mat3 rotX = mat3( 1.,           0.,           0.,
                      0.,           cos(angleX), -sin(angleX),
                      0.,           sin(angleX),  cos(angleX));

    mat3 rotY = mat3( cos(angleY),  0.,           sin(angleY),
                      0.,           1.,           0.,
                     -sin(angleY),  0.,           cos(angleY));

    mat3 rotZ = mat3( cos(angleZ), -sin(angleZ),  0.,
                      sin(angleZ),  cos(angleZ),  0.,
                      0.,           0.,           1.);
    return point*rotX*rotY*rotZ;
}

float angleBetween(vec2 v1, vec2 v2) {
    return acos(dot(v1, v2)/(abs(v1)*abs(v2));
}

float max3 (vec3 v) {
    return max(max(v.x, v.y), v.z);
}

float min3 (vec3 v) {
    return min(min(v.x, v.y), v.z);
}

vec3 scolor (float c_time) {
    return vec3(
        snoise2(vec2(c_time)),
        snoise2(vec2(c_time+0.5)),
        snoise2(vec2(c_time+1.0)),
    );
}

vec2 getAvgRadial(vec2 st, sampler2D tex, vec2 offset) {
    vec3 avg = vec3(0.);
    float count = 0.;

    float angStep = M_PI / float(BL_SPREAD);
    for (int i = 0; i < BL_SPREAD; i++) {
        float curAng  = angStep*float(i);
        vec2 newPoint = rotateAroundPoint(st+offset,st,curAng);
        if (newPoint.x > 0. && newPoint.x <= 1. && newPoint.y > 0. && newPoint.y <= 1.) {
            avg += textureLookup(newPoint,tex);
        }
    }
    return avg/count;
}

vec2 getSlopeRadial(vec2 st, sampler2D tex, float offset) {
    vec2 slope = vec2(0.);
    float count = 0.;

    float angStep = M_PI / float(BL_SPREAD);
    for (int i = 0; i < BL_SPREAD; i++) {
        float curAng  = angStep*float(i);
        vec2 newPoint = rotateAroundPoint(st+vec2(offset,0.),st,curAng);
        if (newPoint.x > 0. && newPoint.x <= 1. && newPoint.y > 0. && newPoint.y <= 1.) {
            vec3 curTexColor = textureLookup(newPoint,tex);
            if (length(curTexColor) <= 0.00001) {
                slope += (st-newPoint);
                count += 1.;
            }
        }
    }
    return slope/count;
}

vec3 textureLookup(vec2 st, sampler2D tex) {
    return texture2D(tex,st).xxx;
}
